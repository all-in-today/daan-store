"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("帳號或密碼錯誤");
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setError("連線失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-[#9a9a8a] mb-1">ALL IN</p>
        <h1 className="text-xl font-light tracking-widest">後台管理</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#e8e3dc] p-8 w-full max-w-sm"
      >
        <div className="mb-4">
          <label className="text-xs tracking-widest uppercase text-[#9a9a8a] block mb-2">帳號</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-[#e8e3dc] px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
          />
        </div>
        <div className="mb-6">
          <label className="text-xs tracking-widest uppercase text-[#9a9a8a] block mb-2">密碼</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#e8e3dc] px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
          />
        </div>
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1a1a1a] text-white text-xs tracking-widest uppercase disabled:opacity-50 hover:bg-[#333] transition-colors"
        >
          {loading ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}
