"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, ExternalLink, Trash } from "lucide-react";

type Attachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

export type Note = {
  id: string;
  title: string;
  content: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  url?: string | null;
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
    return url;
  } catch {
    return url;
  }
}

type Props = {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void> | void; // optional callback if host wants delete handled here
};

export default function NoteViewer({ note, open, onClose, onDelete }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // prevent background scroll
    const original = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open || !note) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          // close if clicked on backdrop (not the content)
          if (e.target === overlayRef.current) onClose();
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full h-full mx-0"
      >
        <Card className="w-full h-full overflow-auto rounded-none">
          <div className="flex items-start justify-between p-4 border-b border-border bg-card">
            <div>
              <h3 className="text-xl font-semibold">{note.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {new Date(note.createdAt).toLocaleString()} • Updated:{" "}
                {new Date(note.updatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {note.url && (
                <a
                  href={note.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm"
                >
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="mr-2 w-4 h-4" /> Open source
                  </Button>
                </a>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="Close viewer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-6 bg-background h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-4 h-full">
                {note.type === "NOTE" && (
                  <div className="prose max-w-none whitespace-pre-line text-sm h-full">
                    {note.content}
                  </div>
                )}

                {note.type === "DOCUMENT" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Attached documents
                    </p>
                    <ul className="space-y-2">
                      {note.attachments?.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <FileIcon mime={a.mimeType} />
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline break-all"
                              >
                                {a.filename}
                              </a>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(a.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <a
                            href={a.url}
                            download={a.filename}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {note.type === "IMAGE" && (
                  <div className="space-y-4">
                    {note.attachments?.map((img) => (
                      <div
                        key={img.id}
                        className="w-full rounded-lg overflow-hidden shadow"
                      >
                        <Image
                          src={img.url}
                          alt={img.filename}
                          width={1200}
                          height={700}
                          className="object-contain w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {note.type === "VIDEO" && note.url && (
                  <div className="space-y-2">
                    <div className="aspect-video rounded overflow-hidden">
                      <iframe
                        src={getEmbedUrl(note.url)}
                        className="w-full h-full"
                        allowFullScreen
                        title={note.title}
                      />
                    </div>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline break-all"
                    >
                      {note.url}
                    </a>
                  </div>
                )}

                {note.type === "LINK" && note.url && (
                  <div className="flex items-center gap-3">
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

              {/* Sidebar: metadata & actions */}
              <aside className="space-y-4 h-full overflow-y-auto">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="text-sm mt-2">
                    Type: <span className="font-medium">{note.type}</span>
                  </p>
                  <p className="text-sm mt-1">
                    ID: <span className="font-mono text-xs">{note.id}</span>
                  </p>
                </div>

                {note.attachments && note.attachments.length > 0 && (
                  <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                    <p className="text-xs text-muted-foreground">Attachments</p>
                    <ul className="text-sm">
                      {note.attachments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{a.filename}</span>
                          <a
                            href={a.url}
                            download={a.filename}
                            className="ml-3"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {onDelete && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        // allow host component to handle delete confirmation & backend
                        await onDelete(note.id);
                        onClose();
                      }}
                    >
                      <Trash className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  )}

                  <Button onClick={onClose} variant="secondary">
                    Close
                  </Button>
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Small file-icon helper (very small, no external deps)
function FileIcon({ mime }: { mime?: string }) {
  const type = (mime || "").split("/")[0];
  if (type === "image")
    return (
      <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs">
        IMG
      </div>
    );
  if (type === "video")
    return (
      <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs">
        VID
      </div>
    );
  return (
    <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs">
      DOC
    </div>
  );
}
