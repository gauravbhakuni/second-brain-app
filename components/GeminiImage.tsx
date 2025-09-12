"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function GeminiImage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResultImage(null);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  // helper to convert File -> base64 (no data: prefix)
  function fileToBase64NoPrefix(
    file: File
  ): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result = data:<mime>;base64,<data>
        const match = result.match(/^data:(.*);base64,(.*)$/);
        if (!match) return reject(new Error("Invalid file read"));
        resolve({ mimeType: match[1], data: match[2] });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      let imagesPayload: Array<{ data: string; mimeType: string }> | undefined =
        undefined;
      if (file) {
        const { data, mimeType } = await fileToBase64NoPrefix(file);
        imagesPayload = [{ data, mimeType }];
      }

      const res = await fetch("/api/agent/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, images: imagesPayload }),
      });

      const json = await res.json();
      if (!res.ok) {
        const errMsg =
          typeof json?.error === "string"
            ? json.error
            : JSON.stringify(json.error);
        setError(errMsg);
        return;
      }

      if (json.image) {
        setResultImage(json.image);
      } else if (json.text) {
        // fallback text-only
        setError(json.text);
      } else {
        setError("No image returned");
      }
    } catch (e: any) {
      setError(e?.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Generate / Edit with Gemini Nano Banana
        </h2>

        <textarea
          className="w-full p-2 border rounded mb-3"
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want (be descriptive: camera, lighting, scene, style, aspect ratio...)"
        />

        <label className="block mb-2">
          Upload an image (optional — for editing/fusion):
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="mt-1"
          />
        </label>

        {preview && (
          <div className="mb-2">
            <span className="text-sm">Preview:</span>
            <img
              src={preview}
              alt="preview"
              className="max-w-full rounded mt-2 border"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={loading || !prompt}>
            {loading ? "Generating..." : "Generate"}
          </Button>
          <Button
            onClick={() => {
              setPrompt("");
              setFile(null);
              setPreview(null);
              setResultImage(null);
              setError(null);
            }}
            variant="ghost"
          >
            Reset
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-2 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Result</h3>
        {resultImage ? (
          <img
            src={resultImage}
            alt="generated"
            className="rounded shadow max-w-full"
          />
        ) : (
          <div className="h-64 border rounded flex items-center justify-center text-muted-foreground">
            No image yet
          </div>
        )}
      </div>
    </div>
  );
}
