"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LevelBadge from "@/components/ranking/LevelBadge";

interface Provocation {
  id: string;
  message: string;
  createdAt: string;
  from: { id: string; nickname: string; level: number };
  to: { id: string; nickname: string; level: number };
}

interface Member {
  memberId: string;
  nickname: string;
  level: number;
}

export default function ProvocationPage() {
  const { code } = useParams() as { code: string };
  const [provocations, setProvocations] = useState<Provocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [toId, setToId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<{ memberId: string } | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setSession);
    loadData();
  }, [code]);

  async function loadData() {
    setLoading(true);
    const res = await fetch(`/api/provocation?unitCode=${code}`);
    if (res.ok) setProvocations(await res.json());
    // 병사 목록 (랭킹에서 가져오기)
    const memberRes = await fetch(`/api/ranking/powerlifting?unitCode=${code}`);
    if (memberRes.ok) setMembers(await memberRes.json());
    setLoading(false);
  }

  async function sendProvocation(e: React.FormEvent) {
    e.preventDefault();
    if (!toId || !message.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/provocation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toId, message }),
    });
    if (res.ok) {
      setShowForm(false);
      setMessage("");
      setToId("");
      loadData();
    }
    setSubmitting(false);
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black">🔥 도발 피드</h1>
          <p className="text-xs text-gray-500 mt-0.5">전군 도발 실시간 현황</p>
        </div>
        {session && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-900/40 border border-red-800 text-red-400 rounded-xl px-3 py-2 text-sm font-bold"
          >
            😈 도발하기
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">불러오는 중...</div>
      ) : provocations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">아직 도발이 없습니다<br/>먼저 도발해보세요!</div>
      ) : (
        <div className="flex flex-col gap-3">
          {provocations.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <LevelBadge level={p.from.level} />
                  <span className="text-sm font-bold">{p.from.nickname}</span>
                </div>
                <span className="text-gray-500">→</span>
                <div className="flex items-center gap-1.5">
                  <LevelBadge level={p.to.level} />
                  <span className="text-sm font-bold text-red-400">{p.to.nickname}</span>
                </div>
                <span className="text-xs text-gray-600 ml-auto">
                  {new Date(p.createdAt).toLocaleDateString("ko")}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-sm text-gray-300">❝ {p.message} ❞</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 도발 보내기 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <form onSubmit={sendProvocation} className="bg-surface border-t border-border rounded-t-3xl p-6 w-full max-w-lg mx-auto">
            <h3 className="text-lg font-black mb-4">😈 도발 보내기</h3>
            <div className="flex flex-col gap-3">
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white"
              >
                <option value="">-- 도발할 병사 선택 --</option>
                {members
                  .filter((m) => m.memberId !== session?.memberId)
                  .map((m) => (
                    <option key={m.memberId} value={m.memberId}>
                      {m.nickname} (Lv.{m.level})
                    </option>
                  ))}
              </select>
              <textarea
                placeholder="도발 메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold">취소</button>
              <button type="submit" disabled={submitting || !toId || !message.trim()} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50">
                {submitting ? "보내는 중..." : "😈 도발 날리기"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
