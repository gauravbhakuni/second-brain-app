// app/api/content/[id]/tags/[tagId]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string, tagId: string } }) {
  try {
    const { id: contentId, tagId } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = await prisma.user.findUnique({ where: { email: session.user.email }});
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const content = await prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    // Only owner or org admin/owner can modify tags
    if (content.ownerId !== actor.id) {
      if (!content.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: actor.id, organizationId: content.organizationId } }
      });
      if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const existing = await prisma.contentItemTag.findUnique({
      where: { contentItemId_tagId: { contentItemId: contentId, tagId } }
    });
    if (!existing) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

    await prisma.contentItemTag.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to detach tag" }, { status: 500 });
  }
}
