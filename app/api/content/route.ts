// app/api/content/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

import formidable, { Files, Fields } from "formidable";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { ContentType } from "@prisma/client"; // prisma enum for type narrowing

// Ensure Node runtime (required for formidable)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Query = {
  page?: string;
  perPage?: string;
  q?: string;
  tag?: string; // tag id or name
  type?: string; // ContentType
  ownerId?: string;
  organizationId?: string;
  visibility?: string; // PRIVATE | ORGANIZATION | PUBLIC
};

// --- helpers --------------------------------------------------------------

function normalizeFields(flds: Fields): Record<string, unknown> {
  // Formidable returns arrays for text fields; unwrap singles.
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(flds)) {
    const val = flds[key];
    out[key] = Array.isArray(val) ? val[0] : val;
  }
  return out;
}

async function parseMultipart(req: Request): Promise<{ fields: Record<string, unknown>; files: Files }> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  const buffer = Buffer.from(await req.arrayBuffer());
  const stream = Readable.from(buffer) as any;
  // mimic Node IncomingMessage headers for formidable
  stream.headers = Object.fromEntries(req.headers.entries());

  return await new Promise((resolve, reject) => {
    form.parse(stream, (err, flds, fls) => {
      if (err) return reject(err);
      resolve({ fields: normalizeFields(flds), files: fls });
    });
  });
}

function isValidContentType(value: unknown): value is ContentType {
  return typeof value === "string" && ["NOTE","TWEET","VIDEO","DOCUMENT","LINK","IMAGE"].includes(value);
}

// --- GET: list content ----------------------------------------------------

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries()) as Query;

    const page = Math.max(1, Number(q.page || 1));
    const perPage = Math.min(100, Math.max(5, Number(q.perPage || 20)));

    const where: any = { archived: false };

    if (q.type) where.type = q.type;
    if (q.ownerId) where.ownerId = q.ownerId;
    if (q.organizationId) where.organizationId = q.organizationId;
    if (q.visibility) where.visibility = q.visibility;

    if (q.q) {
      where.OR = [
        { title: { contains: q.q, mode: "insensitive" } },
        { excerpt: { contains: q.q, mode: "insensitive" } },
        { content: { contains: q.q, mode: "insensitive" } },
      ];
    }

    if (q.tag) {
      where.tags = {
        some: {
          tag: {
            OR: [
              { id: q.tag },
              { name: { contains: q.tag, mode: "insensitive" } },
            ],
          },
        },
      };
    }

    // access rules
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      where.visibility = "PUBLIC";
    } else if (!q.ownerId && !q.organizationId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const memberships = await prisma.membership.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });
      const orgIds = memberships.map((m) => m.organizationId);
      where.OR = [
        { visibility: "PUBLIC" },
        { ownerId: user.id },
        {
          AND: [
            { visibility: "ORGANIZATION" },
            { organizationId: { in: orgIds.length ? orgIds : ["__NO__"] } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          attachments: true,
          shareLinks: true,
          owner: { select: { id: true, name: true, avatarUrl: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.contentItem.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to list content" }, { status: 500 });
  }
}

// --- POST: create content -------------------------------------------------

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const actor = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentTypeHeader = req.headers.get("content-type") || "";
    let fields: Record<string, unknown> = {};
    let files: Files = {};

    if (contentTypeHeader.includes("multipart/form-data")) {
      const parsed = await parseMultipart(req);
      fields = parsed.fields;
      files = parsed.files;
    } else {
      fields = (await req.json()) ?? {};
    }

    // unwrap known fields (strings/booleans)
    const title = fields.title ? String(fields.title) : undefined;
    const excerpt = fields.excerpt ? String(fields.excerpt) : undefined;
    const content = fields.content ? String(fields.content) : undefined;
    const metadata = fields.metadata ? fields.metadata : undefined;
    const urlStr = fields.url ? String(fields.url) : undefined;
    const typeRaw = fields.type ? fields.type : undefined;
    const visibility = fields.visibility ? String(fields.visibility) : "PRIVATE";
    const pinned = fields.pinned === "true" || fields.pinned === true;
    const archived = fields.archived === "true" || fields.archived === true;
    const published = fields.published === "true" || fields.published === true;
    const organizationId = fields.organizationId ? String(fields.organizationId) : null;

    // tagIds normalization
    let tagIds: string[] | undefined;
    if (fields.tagIds) {
      if (Array.isArray(fields.tagIds)) {
        tagIds = fields.tagIds.map((t) => String(t));
      } else if (typeof fields.tagIds === "string") {
        try {
          const parsed = JSON.parse(fields.tagIds);
          tagIds = Array.isArray(parsed) ? parsed.map((t) => String(t)) : [String(fields.tagIds)];
        } catch {
          tagIds = String(fields.tagIds).includes(",")
            ? String(fields.tagIds).split(",").map((s) => s.trim())
            : [String(fields.tagIds)];
        }
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!typeRaw || !isValidContentType(typeRaw)) {
      return NextResponse.json({ error: "Invalid or missing content type" }, { status: 400 });
    }
    const type = typeRaw as ContentType;

    if (organizationId) {
      const membership = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: actor.id, organizationId } },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of the specified organization" },
          { status: 403 }
        );
      }
    }

    // Optional file upload
    let attachmentData:
      | {
          url: string;
          filename: string;
          mimeType: string;
          size: number;
          uploadedById: string;
        }
      | undefined;

    const fileField = (files as any)?.file; // formidable's Files typing can be complex; narrow next
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    if (file && (file as any).filepath) {
      const realFile = file as any;
      // Save into /public/uploads
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filename = realFile.newFilename || path.basename(realFile.filepath);
      const destPath = path.join(uploadDir, filename);
      fs.copyFileSync(realFile.filepath, destPath);

      attachmentData = {
        url: `/uploads/${filename}`,
        filename: realFile.originalFilename ? String(realFile.originalFilename) : filename,
        mimeType: realFile.mimetype ? String(realFile.mimetype) : "application/octet-stream",
        size: typeof realFile.size === "number" ? realFile.size : 0,
        uploadedById: actor.id,
      };
    }

    const created = await prisma.contentItem.create({
      data: {
        title,
        excerpt: excerpt ?? null,
        content: content ?? null,
        metadata: metadata ?? undefined,
        url: urlStr ?? null,
        type, // validated enum
        visibility: visibility as any,
        pinned,
        archived,
        published,
        ownerId: actor.id,
        organizationId,
        tags: tagIds?.length ? { create: tagIds.map((t) => ({ tagId: t })) } : undefined,
        attachments: attachmentData ? { create: [attachmentData] } : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        attachments: true,
        shareLinks: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}
