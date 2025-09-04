// components/ContentList.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export type ContentItem = {
  id: string;
  title: string;
  content?: string | null;
  url?: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
};

interface Props {
  type: string; // "NOTE" | "VIDEO" | "DOCUMENT" | "LINK" | "TWEET"
  title: string; // Heading for the section
}

export default function ContentList({ type, title }: Props) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // fetch function memoized with useCallback
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/content?type=${type}`);
      if (!res.ok) throw new Error("Failed to load content");
      const data = await res.json();
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("Something went wrong while fetching content");
    } finally {
      setLoading(false);
    }
  }, [type]);

  // run fetch on mount and whenever "type" changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function deleteItem(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert("Error deleting item");
    } finally {
      setDeleting(null);
    }
  }

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
        <Button onClick={fetchItems} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="text-center text-muted-foreground">No {title} found.</p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-2">{item.title}</h2>

              {/* Dynamically render content depending on type */}
              {item.type === "VIDEO" && item.url ? (
                <video src={item.url} controls className="rounded-lg w-full" />
              ) : item.type === "DOCUMENT" && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  View Document
                </a>
              ) : item.type === "LINK" && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {item.url}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.content || "No content"}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-muted-foreground">
                {new Date(item.updatedAt).toLocaleDateString()}
              </span>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => deleteItem(item.id)}
                disabled={deleting === item.id}
              >
                {deleting === item.id ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
