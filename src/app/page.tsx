"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"enter" | "create">("enter");
  const [code, setCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${code.trim().toUpperCase()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "존재하지 않는 부대 코드입니다");
        return;
      }
      router.push(`/unit/${code.trim().toUpperCase()}/ranking`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!unitName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: unitName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다");
        return;
      }
      router.push(`/unit/${data.code}/register`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* 헤더 */}
        <div className="text-center">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-3xl font-black text-gold">체단실 랭킹</h1>
          <p className="text-gray-400 text-sm mt-2">전군 파워리프팅 · 특급전사 · 인바디 순위</p>
        </div>

        {/* 탭 */}
        <div className="w-full flex bg-surface rounded-2xl p-1">
          <button
            onClick={() => setTab("enter")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === "enter" ? "bg-gold text-black" : "text-gray-400"
            }`}
          >
            ⚔️ 부대코드 입장
          </button>
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === "create" ? "bg-gold text-black" : "text-gray-400"
            }`}
          >
            🏠 새 부대 등록
          </button>
        </div>

        {/* 입장 폼 */}
        {tab === "enter" && (
          <form onSubmit={handleEnter} className="w-full flex flex-col gap-4">
            <Input
              placeholder="부대 코드 입력 (예: AB3K7Z)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-xl font-bold tracking-widest uppercase"
            />
            {error && <p className="text-danger text-sm text-center">{error}</p>}
            <Button variant="gold" size="lg" type="submit" disabled={loading || !code.trim()}>
              {loading ? "확인 중..." : "⚔️ 입장하기"}
            </Button>
          </form>
        )}

        {/* 부대 등록 폼 */}
        {tab === "create" && (
          <form onSubmit={handleCreate} className="w-full flex flex-col gap-4">
            <Input
              placeholder="부대명 (예: 소청도 흑염소 부대)"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
            {error && <p className="text-danger text-sm text-center">{error}</p>}
            <Button variant="gold" size="lg" type="submit" disabled={loading || !unitName.trim()}>
              {loading ? "등록 중..." : "🏠 부대 등록하기"}
            </Button>
          </form>
        )}

        <p className="text-gray-600 text-xs text-center">
          부대코드를 받아 입장하거나, 새 부대를 등록하여 코드를 공유하세요
        </p>
      </div>
    </main>
  );
}
