"use client";

import { useState } from "react";

type Identity = {
  subjectId: string;
  role: "admin" | "user" | "agent";
};

type ResponseData = {
  output?: string;
  error?: string;
};

export default function MCPApiPage() {
  const [subjectId, setSubjectId] = useState("user-1");
  const [role, setRole] = useState<Identity["role"]>("user");
  const [model, setModel] = useState("gpt-3.5");
  const [tool, setTool] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    setStatusCode(null);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: { subjectId, role },
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

  const isSuccess = statusCode === 200;
  const isError = statusCode && statusCode !== 200;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            MCP API Gateway
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Policy-driven Model Context Protocol endpoint with role-based access control
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Test Request</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Identity Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">
                Identity & Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject ID
                  </label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., user-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="user">User (basic access)</option>
                    <option value="agent">Agent (moderate access)</option>
                    <option value="admin">Admin (full access)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Model & Tool Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">
                Model Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="gpt-3.5">GPT-3.5 (all roles)</option>
                    <option value="gpt-4">GPT-4 (admin only)</option>
                    <option value="gpt-4o">GPT-4o (premium)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tool (Optional)
                  </label>
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => setTool(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., code_interpreter"
                  />
                </div>
              </div>
            </div>

            {/* Prompt Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-4">
                Request Body
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter your prompt here. Try a normal prompt or test content like 'hack', 'exploit', 'bypass'..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setResponse(null);
                  setStatusCode(null);
                }}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Response Card */}
        {response && (
          <div
            className={`rounded-lg shadow-lg overflow-hidden ${
              isSuccess
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : isError
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <div
              className={`px-8 py-4 border-b ${
                isSuccess
                  ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700"
                  : isError
                  ? "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-700"
                  : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`font-semibold ${
                    isSuccess
                      ? "text-emerald-900 dark:text-emerald-300"
                      : isError
                      ? "text-red-900 dark:text-red-300"
                      : "text-slate-900 dark:text-slate-300"
                  }`}
                >
                  Response
                </h3>
                <span
                  className={`text-sm font-mono font-bold px-3 py-1 rounded ${
                    isSuccess
                      ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                      : isError
                      ? "bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300"
                      : "bg-slate-200 dark:bg-slate-900/60 text-slate-800 dark:text-slate-300"
                  }`}
                >
                  {statusCode}
                </span>
              </div>
            </div>
            <div className="p-8">
              {response.output && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Output
                  </p>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded font-mono text-sm overflow-auto max-h-64">
                    {response.output}
                  </pre>
                </div>
              )}
              {response.error && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Error
                  </p>
                  <pre className="bg-slate-900 text-red-400 p-4 rounded font-mono text-sm overflow-auto max-h-64">
                    {response.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 About this API
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>RBAC:</strong> User role determines which models you can access</li>
            <li>• <strong>Content Policy:</strong> Prompts containing "hack", "exploit", or "bypass" are blocked</li>
            <li>• <strong>Usage Policy:</strong> GPT-4 is restricted to admin users only</li>
            <li>• <strong>Audited:</strong> All requests are logged for compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
