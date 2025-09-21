// app/api/content/[id]/tags/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const contentId = params.id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tagId } = await req.json();
    if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

    const content = await prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    // Only owner or org admin/owner can modify tags
    if (content.ownerId !== actor.id) {
      if (!content.organizationId) {
        return NextResponse.json({ error: "Content organizationId is missing" }, { status: 400 });
      }
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: actor.id, organizationId: content.organizationId } }
      });
      if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Verify tag exists and org scoping
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

    if (tag.organizationId && tag.organizationId !== content.organizationId) {
      return NextResponse.json({ error: "Tag belongs to a different organization" }, { status: 400 });
    }

    // Create join if not exists
    const existing = await prisma.contentItemTag.findUnique({
      where: { contentItemId_tagId: { contentItemId: contentId, tagId } }
    });
    if (existing) return NextResponse.json({ error: "Tag already attached" }, { status: 400 });

    const attached = await prisma.contentItemTag.create({
      data: { contentItemId: contentId, tagId },
      include: { tag: true }
    });

    return NextResponse.json(attached, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to attach tag" }, { status: 500 });
  }
}
