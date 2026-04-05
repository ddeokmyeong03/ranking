"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import RankCard from "@/components/ranking/RankCard";
import { formatRunTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { key: "grade", label: "⭐ 종합등급" },
  { key: "run", label: "🏃 뜀걸음" },
  { key: "pushup", label: "💪 팔굽혀펴기" },
  { key: "situp", label: "🦴 윗몸일으키기" },
];

interface MilitaryEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  runTime: number;
  pushups: number;
  situps: number;
  grade: string;
  gradeScore: number;
}

export default function MilitaryPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [sort, setSort] = useState("grade");
  const [data, setData] = useState<MilitaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ memberId: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setSession);
  }, []);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking/military?unitCode=${code}&sort=${sort}`);
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } finally {
      setLoading(false);
    }
  }, [code, sort]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  // 기록 갱신 모달
  const [showForm, setShowForm] = useState(false);
  const [runMin, setRunMin] = useState("");
  const [runSec, setRunSec] = useState("");
  const [pushups, setPushups] = useState("");
  const [situps, setSitups] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitRecord() {
    setSubmitting(true);
    const runTime = (parseInt(runMin) || 0) * 60 + (parseInt(runSec) || 0);
    const res = await fetch("/api/records/military", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runTime, pushups: parseInt(pushups), situps: parseInt(situps) }),
    });
    if (res.ok) {
      setShowForm(false);
      fetchRanking();
    }
    setSubmitting(false);
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black">⭐ 특급전사 랭킹</h1>
          <p className="text-xs text-gray-500 mt-0.5">군 체력 검정 순위</p>
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

      {/* 등급 기준표 */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs text-gray-500 mb-3 font-bold">등급 기준 (셋 다 충족 필요)</p>
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <span className="text-yellow-400 font-black">특급</span>
            <p className="text-gray-500 mt-1">12:30↓<br/>72↑<br/>86↑</p>
          </div>
          <div className="text-center">
            <span className="text-blue-400 font-black">1급</span>
            <p className="text-gray-500 mt-1">13:30↓<br/>58↑<br/>72↑</p>
          </div>
          <div className="text-center">
            <span className="text-green-400 font-black">2급</span>
            <p className="text-gray-500 mt-1">15:00↓<br/>44↑<br/>58↑</p>
          </div>
          <div className="text-center">
            <span className="text-gray-400 font-black">3급</span>
            <p className="text-gray-500 mt-1">나머지</p>
          </div>
        </div>
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

      {/* 랭킹 목록 */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">불러오는 중...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">특급전사 기록이 없습니다</p>
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
              mode="military"
              isCurrentUser={session?.memberId === entry.memberId}
            />
          ))}
        </div>
      )}

      {/* 기록 갱신 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-surface border-t border-border rounded-t-3xl p-6 w-full max-w-lg mx-auto">
            <h3 className="text-lg font-black mb-4">⭐ 특급전사 기록 갱신</h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-gray-400 mb-2">🏃 뜀걸음 3km</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="분" value={runMin} onChange={(e) => setRunMin(e.target.value)}
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-white text-center" />
                  <span className="text-gray-400 self-center">:</span>
                  <input type="number" placeholder="초" value={runSec} onChange={(e) => setRunSec(e.target.value)}
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-white text-center" />
                </div>
                {runMin && <p className="text-xs text-gray-500 mt-1">{formatRunTime((parseInt(runMin)||0)*60+(parseInt(runSec)||0))}</p>}
              </div>
              <input type="number" placeholder="팔굽혀펴기 (2분 횟수)" value={pushups} onChange={(e) => setPushups(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
              <input type="number" placeholder="윗몸일으키기 (2분 횟수)" value={situps} onChange={(e) => setSitups(e.target.value)}
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
