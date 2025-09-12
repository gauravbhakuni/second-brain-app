// app/api/agent/image/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type ImageInput = { data: string; mimeType: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt, images, apiKey: tempApiKey } = body as {
      prompt?: string;
      images?: ImageInput[];
      apiKey?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { apiKeyGemini: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const geminiApiKey = user.apiKeyGemini || tempApiKey;
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API key" }, { status: 400 });
    }

    // Build contents array per Gemini docs:
    // First the text prompt, then (optional) inline_data parts for each image.
    const contents: any[] = [
      {
        parts: [{ text: prompt }],
      },
    ];

    if (Array.isArray(images)) {
      for (const img of images) {
        // Expect img.data to be a base64 string without data:image/... prefix.
        contents[0].parts.push({
          inline_data: {
            mime_type: img.mimeType || "image/png",
            data: img.data,
          },
        });
      }
    }

    // Call Gemini (Nano Banana preview). REST endpoint shown in official docs.
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Docs use x-goog-api-key for API keys:
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      return NextResponse.json({ error: errBody || "Gemini API error" }, { status: res.status });
    }

    const data = await res.json();

    // Find first inlineData (image) in response and convert to data URI
    const parts = data?.candidates?.[0]?.content?.parts || [];
    let imageDataUri: string | null = null;
    let textOutput: string | null = null;

    for (const part of parts) {
      if (part.inlineData || part.inline_data) {
        // some SDKs use inlineData, REST returns inline_data per docs; handle both
        const inline = part.inlineData ?? part.inline_data;
        const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
        const b64 = inline.data;
        if (b64) {
          imageDataUri = `data:${mime};base64,${b64}`;
          break;
        }
      }
      if (part.text) {
        // collect text if model produced descriptive text as well
        textOutput = (textOutput ? textOutput + "\n" : "") + part.text;
      }
      if (part.text === undefined && part?.text === null && part?.inline_data === undefined) {
        // skip
      }
    }

    // If we didn't find image inline_data, return error
    if (!imageDataUri) {
      // maybe the model returned no image (text-only). Return text if available
      if (textOutput) {
        return NextResponse.json({ text: textOutput });
      }
      return NextResponse.json({ error: "No image returned from Gemini" }, { status: 500 });
    }

    // Return the data URI (easy to show in <img src="...">)
    return NextResponse.json({ image: imageDataUri, text: textOutput ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
