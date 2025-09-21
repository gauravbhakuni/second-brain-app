"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";

export default function Settings() {
  const { data: session, update } = useSession();

  const predefinedAvatars = [
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Jade",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Destiny",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Ryan",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=George",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Leah",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Easton",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Riley",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Jameson",
  ];

  const [avatarUrl, setAvatarUrl] = useState<string>(
    session?.user?.image || ""
  );
  const [name, setName] = useState<string>(session?.user?.name || "");
  const [message, setMessage] = useState<string>("");

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);

  async function updateUser(data: Record<string, string>) {
    try {
      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setMessage(`❌ ${json.error || "Failed to update user"}`);
        return;
      }

      const updated = await res.json();
      setMessage("✅ Updated successfully!");

      // update local state
      if (updated.image) setAvatarUrl(updated.image);
      if (updated.name) setName(updated.name);

      // also update session (next-auth)
      await update({
        ...session,
        user: {
          ...session?.user,
          image: updated.image || session?.user?.image,
          name: updated.name || session?.user?.name,
        },
      });

      setEditingAvatar(false);
      setEditingName(false);
    } catch {
      setMessage("❌ Server error");
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      {/* Current Avatar & Name */}
      <div className="flex flex-col items-center mb-6">
        <Image
          src={avatarUrl || "/default-avatar.png"}
          alt="Current Avatar"
          width={100}
          height={100}
          className="rounded-full border shadow"
          unoptimized
        />
        <p className="mt-3 text-lg font-semibold">{name || "Your Name"}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mb-6">
        <Button onClick={() => setEditingAvatar(!editingAvatar)}>
          {editingAvatar ? "Cancel" : "Change Avatar"}
        </Button>
        <Button onClick={() => setEditingName(!editingName)}>
          {editingName ? "Cancel" : "Change Name"}
        </Button>
      </div>

      {/* Avatar Editor */}
      {editingAvatar && (
        <div>
          <p className="mb-2 font-medium">Select a new Avatar:</p>
          <div className="grid grid-cols-4 gap-4">
            {predefinedAvatars.map((url) => (
              <Image
                key={url}
                src={url}
                alt="avatar option"
                className={`cursor-pointer rounded-full border-4 transition ${
                  avatarUrl === url
                    ? "border-blue-500 scale-105"
                    : "border-transparent"
                }`}
                width={80}
                height={80}
                onClick={() => setAvatarUrl(url)}
                unoptimized
              />
            ))}
          </div>
          <Button
            className="mt-4"
            disabled={!avatarUrl}
            onClick={() => updateUser({ image: avatarUrl })}
          >
            Save Avatar
          </Button>
        </div>
      )}

      {/* Name Editor */}
      {editingName && (
        <div className="mt-4">
          <label className="block font-medium mb-2">Enter a new Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Your new name"
          />
          <Button
            className="mt-4"
            disabled={!name.trim()}
            onClick={() => updateUser({ name })}
          >
            Save Name
          </Button>
        </div>
      )}

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
