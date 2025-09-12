"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { FiPlus, FiTrash2, FiSearch, FiEdit2, FiDownload, FiChevronLeft } from "react-icons/fi";

// shadcn/ui components (adjust import paths for your project if necessary)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type NoteMeta = {
  id: string;
  title: string;
  tags: string[];
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
  const [markdown, setMarkdown] = useState<string>("# Welcome\n\nStart writing markdown...");
  const [view, setView] = useState<"both" | "editor" | "preview">("both");
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
        const meta: NoteMeta = { id, title: extractTitle(initialContent), tags: [], updatedAt: Date.now() };
        localStorage.setItem(NOTE_KEY(id), JSON.stringify({ content: initialContent }));
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
      // fallback: create a single note in memory
      const id = uid();
      const initialContent = "# Untitled\n\n";
      const meta: NoteMeta = { id, title: extractTitle(initialContent), tags: [], updatedAt: Date.now() };
      setNotes([meta]);
      setActiveId(id);
      setMarkdown(initialContent);
    }
  }, []);

  // persist index
  function persistIndex(next: NoteMeta[]) {
    setNotes(next);
    try {
      localStorage.setItem(INDEX_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist index", e);
    }
  }

  // auto-save current note (debounced)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!activeId) return;
      try {
        localStorage.setItem(NOTE_KEY(activeId), JSON.stringify({ content: markdown }));
        const next = notes.map((n) => (n.id === activeId ? { ...n, title: extractTitle(markdown), updatedAt: Date.now() } : n));
        persistIndex(next);
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown, activeId]);

  function createNote() {
    const id = uid();
    const initialContent = "# Untitled\n\n";
    const meta: NoteMeta = { id, title: "Untitled", tags: [], updatedAt: Date.now() };
    try {
      localStorage.setItem(NOTE_KEY(id), JSON.stringify({ content: initialContent }));
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
        createNote();
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
      setView("both");
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

  function downloadMarkdownFile() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = notes.find((n) => n.id === activeId)?.title || "note";
    a.download = `${title.replace(/[^a-z0-9-_ ]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // sync line numbers scrolling
  useEffect(() => {
    const ta = textareaRef.current;
    const ln = lineNumberRef.current;
    if (!ta || !ln) return;
    function onScroll() {
      ln!.scrollTop = ta!.scrollTop;
    }
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = notes.filter((n) => {
    const q = query.toLowerCase();
    const content = (localStorage.getItem(NOTE_KEY(n.id)) || "").toLowerCase();
    return n.title.toLowerCase().includes(q) || n.tags.join(" ").toLowerCase().includes(q) || content.includes(q);
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
                  className={`p-3 cursor-pointer hover:bg-muted flex items-start justify-between ${n.id === activeId ? "bg-accent" : ""}`}
                  onClick={() => openNote(n.id)}
                >
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.updatedAt).toLocaleString()}</div>
                    <div className="mt-2 flex gap-1">
                      {n.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setActiveId(n.id); const s = localStorage.getItem(NOTE_KEY(n.id)); if (s) setMarkdown(JSON.parse(s).content || ""); }} title="Edit">
                      <FiEdit2 />
                    </Button>
                    <Button variant="destructive" onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }} title="Delete">
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && <div className="p-4 text-sm text-muted-foreground">No notes found.</div>}
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
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. personal, work" />
              <Button onClick={saveTagsForActive}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="order-1 md:order-2">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{notes.find((n) => n.id === activeId)?.title || "Untitled"}</h2>
            <div className="hidden sm:flex items-center gap-2">
              <Button onClick={() => setView("editor")}>Editor</Button>
              <Button onClick={() => setView("preview")}>Preview</Button>
              <Button onClick={() => setView("both")}>Both</Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={downloadMarkdownFile}>
              <FiDownload />
            </Button>
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(markdown); }}>
              Copy
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="flex flex-col md:flex-row h-[68vh]">
            <div className={`${view === "preview" ? "hidden" : "block"} md:block md:w-1/2 border-r relative bg-card`}>
              <div className="absolute left-0 top-0 bottom-0 w-12 p-2 overflow-auto bg-muted text-right text-xs text-muted-foreground" ref={lineNumberRef} aria-hidden>
                {markdown.split(/\r?\n/).map((_, i) => (
                  <div key={i} className="leading-6 px-1">{i + 1}</div>
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

            <div className={`${view === "editor" ? "hidden" : "block"} md:block md:w-1/2 p-6 overflow-auto bg-muted`}>
              <div className="prose prose-slate max-w-none" aria-live="polite">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight as any]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button onClick={() => setView(view === "editor" ? "both" : "editor")}>{view === "editor" ? <FiChevronLeft /> : <FiEdit2 />}{view === "editor" ? "Both" : "Editor"}</Button>
            <Button onClick={() => setView(view === "preview" ? "both" : "preview")}>{view === "preview" ? <FiChevronLeft /> : <FiDownload />}{view === "preview" ? "Both" : "Preview"}</Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={downloadMarkdownFile}>Download</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
