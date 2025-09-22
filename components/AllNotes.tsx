"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Trash2,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";
import NoteViewer, { Note } from "@/components/NoteViewer";

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
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Fetch notes
  async function fetchNotes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("Failed to load notes");
      const data = await res.json();
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
          return (
            <div
              key={note.id}
              className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border flex flex-col justify-between cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedNote(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedNote(note)}
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">{note.title}</h2>

                {note.type === "NOTE" && note.content && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
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
                      <span className="truncate">{file.filename}</span>
                    </div>
                  ))}

                {note.type === "IMAGE" && note.attachments?.[0] && (
                  <div className="mt-2">
                    <Image
                      src={note.attachments[0].url}
                      alt={note.attachments[0].filename}
                      width={400}
                      height={300}
                      className="w-full h-40 object-cover rounded-lg shadow"
                    />
                  </div>
                )}

                {note.type === "VIDEO" && note.url && (
                  <div className="mt-2">
                    <iframe
                      src={getEmbedUrl(note.url)}
                      className="w-full h-32 rounded"
                      allowFullScreen
                    />
                  </div>
                )}

                {note.type === "LINK" && note.url && (
                  <div className="flex items-center gap-2 mt-2">
                    <LinkIcon size={16} />
                    <span className="truncate text-blue-600 underline">
                      {note.url}
                    </span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
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

      {/* Fullscreen note viewer */}
      <NoteViewer
        note={selectedNote}
        open={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        onDelete={async (id) => {
          await deleteNote(id);
        }}
      />
    </div>
  );
}