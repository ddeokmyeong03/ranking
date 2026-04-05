"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import RankCard from "@/components/ranking/RankCard";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "total", label: "🌐 전체" },
  { key: "level", label: "⭐ 레벨" },
  { key: "growth", label: "📈 상승률" },
  { key: "attendance", label: "📅 출석" },
];

const WORKOUT_STYLE_FILTERS = [
  "전체", "파워형", "지구형", "균형형", "상체형", "하체형", "코어형", "다이어트형", "벌크형", "기타"
];

interface RankEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  benchPress: number;
  deadlift: number;
  squat: number;
  total: number;
  score: number;
  growthPct?: number;
  streak?: number;
}

export default function RankingPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [filter, setFilter] = useState("total");
  const [styleFilter, setStyleFilter] = useState("전체");
  const [data, setData] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ memberId: string } | null>(null);
  const [unitInfo, setUnitInfo] = useState<{ name: string; memberCount: number } | null>(null);
  const [weeklyKing, setWeeklyKing] = useState<RankEntry | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setSession);
    fetch(`/api/units/${code}`).then((r) => r.json()).then(setUnitInfo);
  }, [code]);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ unitCode: code, filter });
      if (styleFilter !== "전체") params.append("style", styleFilter);
      const res = await fetch(`/api/ranking/powerlifting?${params}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
        // 이주의 갱신왕 (임시: 가장 최근 기록 갱신한 사람)
        if (json.length > 0) setWeeklyKing(json[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [code, filter, styleFilter]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  const [showChallenge, setShowChallenge] = useState(false);
  const [challenge, setChallenge] = useState("");

  async function drawChallenge() {
    const res = await fetch("/api/challenge", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setChallenge(data.challenge);
      setShowChallenge(true);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            🏋️ 체단실 랭킹
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {unitInfo?.memberCount ?? "?"}명 · {unitInfo?.name ?? code}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRanking}
            className="bg-card border border-border rounded-xl px-3 py-2 text-sm font-bold text-orange-400"
          >
            🔥 갱신
          </button>
          <button
            onClick={() => router.push(`/unit/${code}/register`)}
            className="bg-gold text-black rounded-xl px-3 py-2 text-sm font-bold"
          >
            + 등록
          </button>
        </div>
      </div>

      {/* 전군 총 전투력 */}
      {data.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-gray-500">⚡ 전군 총 전투력</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-3xl font-black text-gold">
              {data.reduce((sum, r) => sum + r.total, 0).toLocaleString()}
              <span className="text-base text-gray-400 ml-1">kg</span>
            </span>
            <span className="text-sm text-gold font-bold">
              전체 1위 {data[0]?.nickname} 👑
            </span>
          </div>
        </div>
      )}

      {/* 이주의 갱신왕 */}
      {weeklyKing && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <p className="text-xs text-yellow-600">이주의 갱신왕</p>
              <p className="font-bold text-yellow-400">{weeklyKing.nickname}</p>
            </div>
          </div>
          <span className="text-yellow-600 text-sm font-bold">{weeklyKing.total}kg</span>
        </div>
      )}

      {/* 오늘의 도전 뽑기 */}
      <button
        onClick={drawChallenge}
        className="bg-surface border border-border rounded-2xl p-3 text-center text-sm text-gray-400 hover:border-gold/40 transition-colors"
      >
        🎰 오늘의 도전 뽑기
      </button>

      {/* 필터 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
              filter === f.key ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-6 bg-border self-center mx-1" />
        {WORKOUT_STYLE_FILTERS.slice(1).map((s) => (
          <button
            key={s}
            onClick={() => setStyleFilter(styleFilter === s ? "전체" : s)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
              styleFilter === s ? "bg-purple-600 text-white" : "bg-surface border border-border text-gray-400"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 랭킹 목록 */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">불러오는 중...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">아직 기록이 없습니다</p>
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
              mode="powerlifting"
              isCurrentUser={session?.memberId === entry.memberId}
            />
          ))}
        </div>
      )}

      {/* 도전 팝업 */}
      {showChallenge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">🎰</div>
            <h3 className="text-xl font-black text-gold mb-2">오늘의 도전</h3>
            <p className="text-white text-sm leading-relaxed mb-6">{challenge}</p>
            <div className="flex gap-3">
              <button
                onClick={drawChallenge}
                className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold text-gray-400"
              >
                🔄 다시
              </button>
              <button
                onClick={() => setShowChallenge(false)}
                className="flex-1 py-3 rounded-xl bg-gold text-black text-sm font-bold"
              >
                확인 ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
