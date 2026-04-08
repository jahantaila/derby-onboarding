"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Invalid password" : "Login failed");
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm text-white/70 font-body mb-1"
        >
          Admin Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light focus:ring-1 focus:ring-derby-blue-light transition-colors"
          placeholder="Enter password"
        />
      </div>
      {error && (
        <p className="mb-4 text-sm text-red-400 font-body">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-derby-gradient text-white font-body font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
