"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaShareAlt, FaPlus, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("NOTE");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);

      if (content) formData.append("content", content);
      if (url) formData.append("url", url);
      if (file) formData.append("file", file);

      const res = await fetch("/api/content", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create content");

      // Reset form
      setTitle("");
      setContent("");
      setUrl("");
      setFile(null);
      setType("NOTE");

      window.location.reload(); // Refresh notes
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <nav className="flex items-center justify-between bg-sidebar border-b border-border px-4 sm:px-6 py-3 shadow-sm">
      {/* Left: Menu Icon */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {mounted &&
            (theme === "dark" ? (
              <FaMoon className="h-[1.1rem] w-[1.1rem]" />
            ) : (
              <FaSun className="h-[1.1rem] w-[1.1rem]" />
            ))}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Share Button */}
        <Button className="bg-secondary" variant="outline" size="sm">
          <FaShareAlt size={14} />
          <span className="hidden sm:inline ml-1">Share Brain</span>
        </Button>

        {/* Add Content Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <FaPlus size={14} />
              <span className="hidden sm:inline ml-1">Add Content</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Content</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              {/* Content Type */}
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="TWEET">Tweet</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="DOCUMENT">Document</SelectItem>
                  <SelectItem value="LINK">Link</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                </SelectContent>
              </Select>

              {/* Conditional fields */}
              {(type === "NOTE" || type === "TWEET") && (
                <Textarea
                  placeholder="Write your content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              )}

              {(type === "LINK" || type === "VIDEO") && (
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              )}

              {(type === "DOCUMENT" || type === "IMAGE") && (
                <Input
                  type="file"
                  accept={type === "DOCUMENT" ? ".pdf,.doc,.docx" : "image/*"}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              )}

              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
