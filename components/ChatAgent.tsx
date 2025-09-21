"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Provider = "openai" | "gemini";

export default function ChatAgent() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const [mode, setMode] = useState("text");

  const [apiKey, setApiKey] = useState("");
  const [keysStatus, setKeysStatus] = useState<{ openai: boolean; gemini: boolean }>({
    openai: false,
    gemini: false,
  });

  const [error, setError] = useState("");
  const [showKeyForm, setShowKeyForm] = useState(false);

  // Fetch which keys are saved in DB
  useEffect(() => {
    async function fetchKeys() {
      try {
        const res = await fetch("/api/user/api-key");
        const data = await res.json();
        if (!data.error) {
          setKeysStatus(data);
        }
      } catch {
        console.error("Failed to fetch keys status");
      }
    }
    fetchKeys();
  }, []);

  async function sendPrompt() {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider, mode, apiKey }),
      });

      const data = await res.json();

      if (data.error) {
        setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      } else {
        // ✅ Only show text, not raw JSON
        setResponse(data.text || "No response");
      }
    } catch {
      setError("Error communicating with AI");
    } finally {
      setLoading(false);
    }
  }

  async function saveApiKey() {
    if (!apiKey) return;
    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${provider} API key saved successfully!`);
        setApiKey("");
        setKeysStatus((prev) => ({ ...prev, [provider]: true }));
        setShowKeyForm(false);
      } else {
        alert("Error saving API key: " + data.error);
      }
    } catch {
      alert("Failed to save API key");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Left Panel: Commands */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">AI Agent</h1>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me anything..."
          className="w-full p-2 border rounded"
          rows={6}
        />

        <div className="flex flex-col gap-3">
          {/* Provider Selection */}
          <label className="flex flex-col">
            Provider
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as Provider);
                setShowKeyForm(false);
              }}
              className="p-2 border rounded bg-background/60"
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
            </select>
          </label>

          {/* Mode Selection */}
          <label className="flex flex-col">
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="p-2 border rounded bg-background/60"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>

          {/* API Key Management */}
          <div className="space-y-2">
            {keysStatus[provider] && !showKeyForm ? (
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">
                  ✅ {provider.toUpperCase()} API key saved
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyForm(true)}
                >
                  Update
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col">
                  {provider.toUpperCase()} API Key
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter ${provider} API Key`}
                    className="p-2 border rounded"
                  />
                </label>
                <div className="flex gap-2">
                  <Button onClick={saveApiKey} variant="outline">
                    Save API Key
                  </Button>
                  {keysStatus[provider] && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowKeyForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Send Prompt */}
          <Button onClick={sendPrompt} disabled={loading}>
            {loading ? "Loading..." : "Send"}
          </Button>
        </div>
      </div>

      {/* Right Panel: Response */}
      <div className="p-4 border rounded bg-muted overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Response</h2>
        {error && (
          <pre className="p-2 text-red-600 bg-red-100 rounded">{error}</pre>
        )}
        {response && (
          <pre className="whitespace-pre-wrap break-words">{response}</pre>
        )}
      </div>
    </div>
  );
}
