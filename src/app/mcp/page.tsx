"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Identity = {
  subjectId: string;
  role: "admin" | "user" | "agent";
};

type ResponseData = { output?: string; error?: string; };

export default function MCPApiPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  
  // Form State
  const [model, setModel] = useState("gpt-3.5");
  const [tool, setTool] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  // 1. Check for Login Session on Load
  useEffect(() => {
    const stored = sessionStorage.getItem("mcp_identity");
    if (!stored) {
      router.push("/"); // Kick them back to login if no session exists
    } else {
      setIdentity(JSON.parse(stored));
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity) return;

    setLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 2. Send the stored identity automatically
        body: JSON.stringify({
          identity, 
          prompt,
          model,
          tool: tool || undefined,
        }),
      });

      setStatusCode(res.status);
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message || "Network error" });
      setStatusCode(0);
    } finally {
      setLoading(false);
    }
  }

  // Prevent flicker before redirect
  if (!identity) return null;

  const isSuccess = statusCode === 200;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">MCP Dashboard</h1>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-zinc-500">Logged in as:</span>
              <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-bold">
                {identity.subjectId}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-700">
                {identity.role}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              sessionStorage.removeItem("mcp_identity");
              router.push("/");
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="gpt-3.5">GPT-3.5</option>
                      <option value="gpt-4">GPT-4 (Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Tool</label>
                    <input
                      type="text"
                      value={tool}
                      onChange={(e) => setTool(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
                      placeholder="Optional..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-2">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter command..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Execute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPrompt(""); setResponse(null); }}
                    className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </form>
          </div>

          {/* Output Log */}
          <div className="lg:col-span-1 space-y-4">
             {response && (
              <div className={`rounded-xl border p-4 ${
                isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-900" : 
                "bg-red-50 border-red-200 text-red-900"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase">Status: {statusCode}</span>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {response.error || response.output}
                </pre>
              </div>
            )}
            
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
               <p className="font-bold mb-1">Testing Tips:</p>
               <ul className="list-disc pl-4 space-y-1">
                 <li>Login as <strong>Admin</strong> to use GPT-4.</li>
                 <li>Try banned words like "hack" to test filters.</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}