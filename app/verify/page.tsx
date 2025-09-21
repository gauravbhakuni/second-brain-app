"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

export default function VerifyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to verify");
        setLoading(false);
        return;
      }
  // Sign out and redirect to login with a message
  await signOut({ redirect: false });
  router.push("/login?verified=1");
    } catch {
      setError("Server error");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
  <h1 className="text-2xl font-bold mb-4">Verify your email</h1>
  <p className="mb-2 text-gray-400 text-sm">After verifying, you will be redirected to login. Please log in again.</p>
      <Button onClick={handleVerify} disabled={loading || !session?.user?.email}>
        {loading ? "Verifying..." : "Verify"}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}