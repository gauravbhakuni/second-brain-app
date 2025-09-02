"use client";

import { useState } from "react";

export default function Settings() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Replace this with your API endpoint to update avatarUrl in DB
      const res = await fetch("/api/auth/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(`Error: ${data.message || "Failed to update avatar"}`);
        return;
      }

      setMessage("Avatar updated successfully!");
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <label htmlFor="avatarUrl" className="block font-medium">
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          type="text"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="Enter new avatar URL"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button type="submit" className="btn-primary">
          Update Avatar
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
