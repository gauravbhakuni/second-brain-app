"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Trash2,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

type Attachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

type Note = {
  id: string;
  title: string;
  content: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  url?: string | null; // 👈 match your DB
};

function getEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    return url; // fallback (non-YouTube)
  } catch {
    return url;
  }
}

export default function AllNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch notes
  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("Failed to load notes");
      const data = await res.json();
      // console.log("📦 API response:", data); // 🔍 full API response
      setNotes(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Something went wrong while fetching notes");
    } finally {
      setLoading(false);
    }
  }

  // Delete a note
  async function deleteNote(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert("Error deleting note");
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Button onClick={fetchNotes} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return <p className="text-center text-muted-foreground">No notes found.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Notes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => {
          // console.log("📝 Note:", note);
          return (
            <div
              key={note.id}
              className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">{note.title}</h2>

                {/* Render content depending on type */}
                {note.type === "NOTE" && note.content && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {note.content}
                  </p>
                )}

                {note.type === "DOCUMENT" &&
                  note.attachments?.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 mt-2 text-blue-600"
                    >
                      <FileText size={16} />
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {file.filename}
                      </a>
                    </div>
                  ))}

                {note.type === "IMAGE" &&
                  note.attachments?.map((img) => (
                    <div key={img.id} className="mt-2">
                      <Image
                        src={img.url}
                        alt={img.filename}
                        className="w-full rounded-lg shadow"
                      />
                    </div>
                  ))}

                {note.type === "VIDEO" && note.url && (
                  <div className="mt-2">
                    <iframe
                      src={getEmbedUrl(note.url)}
                      className="w-full h-48 rounded"
                      allowFullScreen
                    />
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline text-sm block mt-1 break-all"
                    >
                      {note.url}
                    </a>
                  </div>
                )}

                {/* Render LINK type */}
                {note.type === "LINK" && note.url && (
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon size={16} />
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      {note.url}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteNote(note.id)}
                  disabled={deleting === note.id}
                >
                  {deleting === note.id ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
