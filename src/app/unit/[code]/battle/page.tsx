"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatRunTime } from "@/lib/utils";

interface PLEntry {
  memberId: string;
  nickname: string;
  level: number;
  total: number;
  score: number;
}

interface MilEntry {
  memberId: string;
  nickname: string;
  level: number;
  grade: string;
  gradeScore: number;
  runTime: number;
}

export default function BattlePage() {
  const { code } = useParams() as { code: string };
  const [plData, setPlData] = useState<PLEntry[]>([]);
  const [milData, setMilData] = useState<MilEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pl" | "military">("pl");
  const [vs, setVs] = useState<{ a: PLEntry | null; b: PLEntry | null }>({ a: null, b: null });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [plRes, milRes] = await Promise.all([
        fetch(`/api/ranking/powerlifting?unitCode=${code}`),
        fetch(`/api/ranking/military?unitCode=${code}`),
      ]);
      if (plRes.ok) setPlData(await plRes.json());
      if (milRes.ok) setMilData(await milRes.json());
      setLoading(false);
    }
    load();
  }, [code]);

  if (loading) return <div className="p-4 text-center text-gray-500 pt-12">불러오는 중...</div>;

  // 1v1 대결 결과
  const vsResult = vs.a && vs.b
    ? vs.a.total > vs.b.total ? vs.a : vs.a.total < vs.b.total ? vs.b : null
    : null;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-black">🚩 부대전</h1>
        <p className="text-xs text-gray-500 mt-0.5">팀별 랭킹 & 1대1 대결</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pl")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab === "pl" ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"}`}
        >
          💪 파워리프팅
        </button>
        <button
          onClick={() => setActiveTab("military")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab === "military" ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"}`}
        >
          ⭐ 특급전사
        </button>
      </div>

      {/* 1v1 대결 */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-black mb-3">⚔️ 1대1 대결</h3>
        <div className="flex items-center gap-3">
          <select
            value={vs.a?.memberId || ""}
            onChange={(e) => {
              const m = plData.find((p) => p.memberId === e.target.value) || null;
              setVs((v) => ({ ...v, a: m }));
            }}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="">-- 도전자 --</option>
            {plData.map((m) => (
              <option key={m.memberId} value={m.memberId}>{m.nickname}</option>
            ))}
          </select>
          <span className="text-gold font-black">VS</span>
          <select
            value={vs.b?.memberId || ""}
            onChange={(e) => {
              const m = plData.find((p) => p.memberId === e.target.value) || null;
              setVs((v) => ({ ...v, b: m }));
            }}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="">-- 상대 --</option>
            {plData.map((m) => (
              <option key={m.memberId} value={m.memberId}>{m.nickname}</option>
            ))}
          </select>
        </div>
        {vs.a && vs.b && (
          <div className="mt-4 p-4 bg-surface rounded-xl text-center">
            <div className="flex items-center justify-around">
              <div>
                <p className="font-black text-lg">{vs.a.nickname}</p>
                <p className="text-gold font-black text-2xl">{vs.a.total}kg</p>
              </div>
              <div className="text-gray-500 font-black">VS</div>
              <div>
                <p className="font-black text-lg">{vs.b.nickname}</p>
                <p className="text-gold font-black text-2xl">{vs.b.total}kg</p>
              </div>
            </div>
            {vsResult ? (
              <p className="mt-3 text-success font-black">🏆 {vsResult.nickname} 승리!</p>
            ) : (
              <p className="mt-3 text-gray-400 font-bold">🤝 동점!</p>
            )}
          </div>
        )}
      </div>

      {/* 전체 순위 */}
      {activeTab === "pl" && (
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-sm text-gray-400">파워리프팅 전체 순위</h3>
          {plData.map((entry, i) => (
            <div key={entry.memberId} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black w-6 text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="font-bold">{entry.nickname}</span>
              </div>
              <span className="text-gold font-black">{entry.total}kg</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "military" && (
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-sm text-gray-400">특급전사 전체 순위</h3>
          {milData.map((entry, i) => (
            <div key={entry.memberId} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black w-6 text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div>
                  <span className="font-bold">{entry.nickname}</span>
                  <p className="text-xs text-gray-500">🏃 {formatRunTime(entry.runTime)}</p>
                </div>
              </div>
              <span className={`font-black ${entry.grade === "특급" ? "text-yellow-400" : entry.grade === "1급" ? "text-blue-400" : "text-green-400"}`}>
                {entry.grade}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
