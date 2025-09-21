// app/api/content/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function isOrgAdminOrOwner(userId: string, orgId: string | null) {
  if (!orgId) return false;
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  return !!membership && (membership.role === "ADMIN" || membership.role === "OWNER");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const content = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        attachments: true,
        shareLinks: true,
        owner: { select: { id: true, name: true, avatarUrl: true } },
        organization: { select: { id: true, name: true, slug: true } }
      }
    });

    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Visibility checks for unauthenticated users
    if (content.visibility === "PUBLIC") return NextResponse.json(content);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Owner can access
    if (content.ownerId === user.id) return NextResponse.json(content);

    // Organization visibility: check membership
    if (content.visibility === "ORGANIZATION" && content.organizationId) {
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: content.organizationId } }
      });
      if (membership) return NextResponse.json(content);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Default deny
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const upData: any = {};
    const allowed = ["title","excerpt","content","metadata","url","type","visibility","pinned","archived","published","publishedAt","organizationId"];
    for (const key of allowed) {
      if (body[key] !== undefined) upData[key] = body[key];
    }

    const existing = await prisma.contentItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Permission: owner OR org admin/owner
    if (existing.ownerId !== actor.id) {
      const isAdmin = await isOrgAdminOrOwner(actor.id, existing.organizationId);
      if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If organizationId changing, ensure actor is member of new org
    if (upData.organizationId && upData.organizationId !== existing.organizationId) {
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: actor.id, organizationId: upData.organizationId } }
      });
      if (!membership) return NextResponse.json({ error: "You are not a member of the new organization" }, { status: 403 });
    }

    const updated = await prisma.contentItem.update({
      where: { id },
      data: upData,
      include: {
        tags: { include: { tag: true } },
        attachments: true,
        shareLinks: true
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.contentItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.ownerId !== actor.id) {
      const isAdmin = await isOrgAdminOrOwner(actor.id, existing.organizationId);
      if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft-delete pattern? Here we hard-delete; change to soft delete by setting deletedAt if preferred.
    await prisma.contentItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
