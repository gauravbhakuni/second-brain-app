// app/api/agent/chat/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt, provider, mode, apiKey: tempApiKey } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prefer saved API key, fallback to request-provided
    const apiKey =
      provider === "openai"
        ? user.apiKeyOpenAI || tempApiKey
        : user.apiKeyGemini || tempApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: `Missing API key for ${provider}` },
        { status: 400 }
      );
    }

    // 🔹 OpenAI
    if (provider === "openai" && mode === "text") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // Use a small, efficient model
          model: "gpt-4o-mini",
          // Minimal context = fewer tokens
          messages: [{ role: "user", content: prompt }],
          max_tokens: 256, // limit output length
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        return NextResponse.json({ error }, { status: res.status });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";
      return NextResponse.json({ text });
    }

    // 🔹 Gemini
    if (provider === "gemini" && mode === "text") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 256, // minimize output tokens
            },
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        return NextResponse.json({ error }, { status: res.status });
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: "Unsupported provider/mode" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
