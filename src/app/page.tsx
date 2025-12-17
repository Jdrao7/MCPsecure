"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 1. THIS IS YOUR FAKE DATABASE
// In the real industry, this data comes from your backend SQL/NoSQL DB.
const MOCK_USER_DB: Record<string, { role: "admin" | "user" | "agent"; id: string }> = {
  "admin@mcp.com": { role: "admin", id: "admin-01" },
  "agent@mcp.com": { role: "agent", id: "agent-007" },
  "user@mcp.com":  { role: "user", id: "user-101" },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 2. SIMULATE THE DB LOOKUP
    // We check if the email exists in our fake object
    const user = MOCK_USER_DB[email.toLowerCase()];

    if (!user) {
      // 3. HANDLE "USER NOT FOUND"
      setError("❌ Access Denied: Email not found in database.");
      return;
    }

    // 4. SUCCESS - SAVE THE IDENTITY RETRIEVED FROM "DB"
    sessionStorage.setItem("mcp_identity", JSON.stringify({ 
      subjectId: user.id, 
      role: user.role 
    }));
    
    router.push("/mcp");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        <div className="bg-indigo-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MCP Secure Login</h1>
          <p className="text-indigo-100 mt-2 text-sm">Enter your verified email</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-indigo-500/30"
          >
            Sign In
          </button>
          
          {/* Helper text for the prototype so you don't forget the emails */}
          <div className="text-xs text-center text-zinc-400 mt-4">
            <p>Prototype Credentials:</p>
            <p>admin@mcp.com • user@mcp.com • agent@mcp.com</p>
          </div>
        </form>
      </div>
    </div>
  );
}