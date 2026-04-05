"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import RankCard from "@/components/ranking/RankCard";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { key: "muscle", label: "💪 골격근량" },
  { key: "fat", label: "🔥 체지방률" },
  { key: "change", label: "📉 체중변화율" },
];

interface InbodyEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  muscleMass: number;
  bodyFatPct: number;
  weight: number;
  weightChangePct: number;
}

export default function InbodyPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [sort, setSort] = useState("muscle");
  const [data, setData] = useState<InbodyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ memberId: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setSession);
  }, []);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking/inbody?unitCode=${code}&sort=${sort}`);
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } finally {
      setLoading(false);
    }
  }, [code, sort]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  async function submitRecord() {
    setSubmitting(true);
    const res = await fetch("/api/records/inbody", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        muscleMass: parseFloat(muscleMass),
        bodyFatPct: parseFloat(bodyFatPct),
        weight: parseFloat(weight),
      }),
    });
    if (res.ok) {
      setShowForm(false);
      fetchRanking();
    }
    setSubmitting(false);
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black">📊 인바디 랭킹</h1>
          <p className="text-xs text-gray-500 mt-0.5">체성분 순위</p>
        </div>
        {session && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gold text-black rounded-xl px-3 py-2 text-sm font-bold"
          >
            🔥 갱신
          </button>
        )}
      </div>

      {/* 정렬 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
              sort === s.key ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 안내 */}
      <div className="bg-card border border-border rounded-2xl p-3 text-xs text-gray-400">
        <p>💪 <strong className="text-white">골격근량</strong>: 높을수록 상위</p>
        <p>🔥 <strong className="text-white">체지방률</strong>: 낮을수록 상위</p>
        <p>📉 <strong className="text-white">체중변화율</strong>: 첫 기록 대비 감량 많을수록 상위</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">불러오는 중...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">인바디 기록이 없습니다</p>
          <button
            onClick={() => router.push(`/unit/${code}/register`)}
            className="text-gold font-bold"
          >
            첫 번째로 등록하기 →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((entry) => (
            <RankCard
              key={entry.memberId}
              {...entry}
              unitCode={code}
              mode="inbody"
              isCurrentUser={session?.memberId === entry.memberId}
            />
          ))}
        </div>
      )}

      {/* 기록 입력 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-surface border-t border-border rounded-t-3xl p-6 w-full max-w-lg mx-auto">
            <h3 className="text-lg font-black mb-4">📊 인바디 기록 갱신</h3>
            <div className="flex flex-col gap-3">
              <input type="number" placeholder="골격근량 (kg)" value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
              <input type="number" placeholder="체지방률 (%)" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
              <input type="number" placeholder="현재 체중 (kg)" value={weight} onChange={(e) => setWeight(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold">취소</button>
              <button onClick={submitRecord} disabled={submitting} className="flex-1 py-3 rounded-xl bg-gold text-black text-sm font-bold disabled:opacity-50">
                {submitting ? "저장 중..." : "🔥 갱신하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
