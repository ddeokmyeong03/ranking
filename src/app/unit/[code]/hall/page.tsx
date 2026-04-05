"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatRunTime } from "@/lib/utils";

type Category = "powerlifting" | "military" | "inbody";

interface PLEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  benchPress: number;
  deadlift: number;
  squat: number;
  total: number;
}

interface MilEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  runTime: number;
  pushups: number;
  situps: number;
  grade: string;
}

interface InbodyEntry {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  muscleMass: number;
  bodyFatPct: number;
  weight: number;
}

type HallEntry = PLEntry | MilEntry | InbodyEntry;

export default function HallPage() {
  const { code } = useParams() as { code: string };
  const [category, setCategory] = useState<Category>("powerlifting");
  const [data, setData] = useState<HallEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hall?unitCode=${code}&category=${category}`)
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); });
  }, [code, category]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-black">💀 명예의 전당</h1>
        <p className="text-xs text-gray-500 mt-0.5">현재 개인 최고기록 TOP</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: "powerlifting", label: "💪 파워리프팅" },
          { key: "military", label: "⭐ 특급전사" },
          { key: "inbody", label: "📊 인바디" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key as Category)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
              category === key ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">불러오는 중...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">기록이 없습니다</div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((entry, i) => (
            <div
              key={entry.memberId}
              className={`bg-card border rounded-2xl p-4 ${i === 0 ? "border-gold/40 bg-gold/5" : "border-border"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <span className="font-black text-lg">{entry.nickname}</span>
                </div>
                {category === "powerlifting" && (
                  <span className="text-gold font-black text-xl">{(entry as PLEntry).total}<span className="text-sm text-gray-400">kg</span></span>
                )}
                {category === "military" && (
                  <span className={`font-black text-xl ${(entry as MilEntry).grade === "특급" ? "text-yellow-400" : (entry as MilEntry).grade === "1급" ? "text-blue-400" : "text-green-400"}`}>
                    {(entry as MilEntry).grade}
                  </span>
                )}
                {category === "inbody" && (
                  <span className="text-blue-400 font-black text-xl">{(entry as InbodyEntry).muscleMass}<span className="text-sm text-gray-400">kg</span></span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {category === "powerlifting" && (
                  <span>벤치 {(entry as PLEntry).benchPress} · 데드 {(entry as PLEntry).deadlift} · 스쿼트 {(entry as PLEntry).squat}</span>
                )}
                {category === "military" && (
                  <span>🏃 {formatRunTime((entry as MilEntry).runTime)} · 팔굽 {(entry as MilEntry).pushups} · 윗몸 {(entry as MilEntry).situps}</span>
                )}
                {category === "inbody" && (
                  <span>체지방 {(entry as InbodyEntry).bodyFatPct}% · 체중 {(entry as InbodyEntry).weight}kg</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
