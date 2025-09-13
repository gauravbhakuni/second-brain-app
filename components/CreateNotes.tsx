"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import {
  FiPlus,
  FiTrash2,
  FiSearch,
  FiEdit2,
} from "react-icons/fi";
import type { Pluggable } from "unified";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import DownloadOptions from "./DownloadOptions";

type NoteMeta = {
  id: string;
  title: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

const INDEX_KEY = "create_notes_index_v1";
const NOTE_KEY = (id: string) => `create_note_v1_${id}`;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function extractTitle(md: string) {
  const lines = md.split(/\r?\n/).map((l) => l.trim());
  for (const l of lines) {
    if (l.startsWith("# ")) return l.replace(/^# /, "").slice(0, 60);
  }
  const first = lines.find((l) => l.length > 0) || "Untitled note";
  return first.slice(0, 60);
}

export default function CreateNotes(): React.ReactElement {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>(
    "# Welcome\n\nStart writing markdown..."
  );
  const [view, setView] = useState<"both" | "editor" | "preview">(
    typeof window !== "undefined" && window.innerWidth >= 768
      ? "both"
      : "editor"
  );
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumberRef = useRef<HTMLDivElement | null>(null);

  // load index and first note
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INDEX_KEY);
      let idx: NoteMeta[] = raw ? JSON.parse(raw) : [];

      if (idx.length === 0) {
        const id = uid();
        const initialContent = "# Untitled\n\n";
        const meta: NoteMeta = {
          id,
          title: "Untitled",
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        localStorage.setItem(
          NOTE_KEY(id),
          JSON.stringify({ content: initialContent })
        );
        idx = [meta];
        localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
      }

      setNotes(idx);
      const first = idx[0];
      setActiveId(first.id);
      const stored = localStorage.getItem(NOTE_KEY(first.id));
      if (stored) {
        const parsed = JSON.parse(stored);
        setMarkdown(parsed.content || "");
        setTagInput((first.tags || []).join(", "));
      }
    } catch {
      const id = uid();
      const initialContent = "# Untitled\n\n";
      const meta: NoteMeta = {
        id,
        title: extractTitle(initialContent),
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes([meta]);
      setActiveId(id);
      setMarkdown(initialContent);
    }
  }, []);

  // handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setView("both");
      else if (view === "both") setView("editor"); // keep small screen default editor
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  // persist index
  function persistIndex(next: NoteMeta[]) {
    setNotes(next);
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist index", e);
    }
  }

  // auto-save current note
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!activeId) return;

      // Save markdown content
      localStorage.setItem(
        NOTE_KEY(activeId),
        JSON.stringify({ content: markdown })
      );

      // Update only the active note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeId
            ? { ...n, title: extractTitle(markdown), updatedAt: Date.now() }
            : n
        )
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [markdown, activeId]); // ✅ removed `notes`

  function createNote() {
    const id = uid();
    const initialContent = "# Untitled\n\n";
    const meta: NoteMeta = {
      id,
      title: "Untitled",
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(
        NOTE_KEY(id),
        JSON.stringify({ content: initialContent })
      );
    } catch (e) {
      console.error(e);
    }
    const next = [meta, ...notes];
    persistIndex(next);
    setActiveId(id);
    setMarkdown(initialContent);
    setTagInput("");
    setView("editor");
  }

  function deleteNote(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    try {
      localStorage.removeItem(NOTE_KEY(id));
    } catch (e) {
      console.error(e);
    }
    const next = notes.filter((n) => n.id !== id);
    persistIndex(next);
    if (activeId === id) {
      if (next.length > 0) {
        setActiveId(next[0].id);
        const s = localStorage.getItem(NOTE_KEY(next[0].id));
        if (s) setMarkdown(JSON.parse(s).content || "");
      } else {
        // No notes left
        setActiveId(null);
        setMarkdown("");
      }
    }
  }

  function openNote(id: string) {
    const s = localStorage.getItem(NOTE_KEY(id));
    if (s) {
      setActiveId(id);
      setMarkdown(JSON.parse(s).content || "");
      const meta = notes.find((n) => n.id === id);
      setTagInput(meta ? meta.tags.join(", ") : "");
      setView("editor");
    }
  }

  function saveTagsForActive() {
    if (!activeId) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const next = notes.map((n) => (n.id === activeId ? { ...n, tags } : n));
    persistIndex(next);
    setTagInput(tags.join(", "));
  }

  // sync line numbers scrolling
  useEffect(() => {
    const ta = textareaRef.current;
    const ln = lineNumberRef.current;
    if (!ta || !ln) return;

    const handleScroll = () => {
      if (ln && ta) {
        ln.scrollTop = ta.scrollTop;
      }
    };

    ta.addEventListener("scroll", handleScroll);

    return () => {
      ta.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const filtered = notes.filter((n) => {
    const q = query.toLowerCase();
    const content = (localStorage.getItem(NOTE_KEY(n.id)) || "").toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.tags.join(" ").toLowerCase().includes(q) ||
      content.includes(q)
    );
  });

  return (
    <div className="dashboard-layout min-h-screen max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      <aside className="order-2 md:order-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Notes</CardTitle>
              <Button onClick={createNote} aria-label="New note">
                <FiPlus />
              </Button>
            </div>
            <div className="mt-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <FiSearch />
                </div>
                <Input
                  placeholder="Search notes or tags..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y overflow-auto max-h-[64vh]">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 cursor-pointer hover:bg-muted flex items-start justify-between ${
                    n.id === activeId ? "bg-accent" : ""
                  }`}
                  onClick={() => openNote(n.id)}
                >
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(n.createdAt).toLocaleString()}
                      <br />
                      Updated: {new Date(n.updatedAt).toLocaleString()}
                    </div>

                    <div className="mt-2 flex gap-1">
                      {n.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(n.id);
                        const s = localStorage.getItem(NOTE_KEY(n.id));
                        if (s) setMarkdown(JSON.parse(s).content || "");
                      }}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.id);
                      }}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No notes found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm">Comma separated</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. personal, work"
              />
              <Button onClick={saveTagsForActive}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="order-1 md:order-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {notes.find((n) => n.id === activeId)?.title || "Untitled"}
            </h2>

            <div className="flex items-center gap-2">
              {/* Editor button */}
              <Button
                variant={view === "editor" ? "default" : "outline"}
                onClick={() => setView("editor")}
              >
                Editor
              </Button>

              {/* Preview button */}
              <Button
                variant={view === "preview" ? "default" : "outline"}
                onClick={() => setView("preview")}
              >
                Preview
              </Button>

              {/* Both button: only visible on medium+ screens */}
              <Button
                variant={view === "both" ? "default" : "outline"}
                className="hidden md:inline-flex"
                onClick={() => setView("both")}
              >
                Both
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DownloadOptions markdown={markdown} />

            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(markdown);
              }}
            >
              Copy
            </Button>
          </div>
        </div>

        {/* editor / preview container */}
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
          <div className={`flex flex-col md:flex-row h-[80vh]`}>
            {/* Editor */}
            <div
              className={`${
                view === "preview" ? "hidden" : "flex"
              } flex-col w-full ${
                view === "both" ? "md:w-1/2" : ""
              } border-r relative bg-card h-full`}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-12 p-2 overflow-auto bg-muted text-right text-xs text-muted-foreground"
                ref={lineNumberRef}
                aria-hidden
              >
                {markdown.split(/\r?\n/).map((_, i) => (
                  <div key={i} className="leading-6 px-1">
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="w-full h-full resize-none outline-none border-none font-mono text-sm leading-6 p-4 pl-16 bg-transparent"
                placeholder="# Start writing..."
              />
            </div>

            {/* Preview */}
            <div
            id="preview-container"
              className={`${
                view === "editor" ? "hidden" : "flex"
              } flex-col w-full ${
                view === "both" ? "md:w-1/2" : ""
              } p-6 overflow-auto bg-muted h-full`}
            >
              <div className="prose prose-slate max-w-none" aria-live="polite">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight as Pluggable]}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
