"use client";

import Link from "next/link";
import { User } from "lucide-react";
import LevelBadge from "./LevelBadge";
import TierBadge from "./TierBadge";
import MilitaryGradeBadge from "./MilitaryGradeBadge";
import { formatRunTime } from "@/lib/utils";
import { WORKOUT_STYLE_COLORS } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type CardMode = "powerlifting" | "military" | "inbody";

interface RankCardProps {
  rank: number;
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  unitCode: string;
  mode: CardMode;
  // powerlifting
  benchPress?: number;
  deadlift?: number;
  squat?: number;
  total?: number;
  score?: number;
  growthPct?: number;
  streak?: number;
  // military
  runTime?: number;
  pushups?: number;
  situps?: number;
  grade?: string;
  // inbody
  muscleMass?: number;
  bodyFatPct?: number;
  weightChangePct?: number;
  isCurrentUser?: boolean;
}

export default function RankCard({
  rank,
  memberId,
  nickname,
  level,
  workoutStyle,
  photoUrl,
  unitCode,
  mode,
  benchPress,
  deadlift,
  squat,
  total,
  score,
  growthPct,
  streak,
  runTime,
  pushups,
  situps,
  grade,
  muscleMass,
  bodyFatPct,
  weightChangePct,
  isCurrentUser,
}: RankCardProps) {
  const rankDisplay =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return (
    <Link href={`/unit/${unitCode}/profile/${memberId}`}>
      <div
        className={cn(
          "bg-card border rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform",
          rank === 1 ? "border-gold/40 bg-gold/5" : "border-border",
          isCurrentUser && "ring-1 ring-gold/30"
        )}
      >
        {/* 순위 */}
        <div className="w-8 text-center text-sm font-bold flex-shrink-0">
          {rank <= 3 ? (
            <span className="text-lg">{rankDisplay}</span>
          ) : (
            <span className="text-gray-500">{rankDisplay}</span>
          )}
        </div>

        {/* 아바타 */}
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={nickname} className="w-full h-full object-cover" />
          ) : (
            <User size={18} className="text-gray-500" />
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white truncate">{nickname}</span>
            <LevelBadge level={level} />
            {workoutStyle[0] && (
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-lg border",
                  WORKOUT_STYLE_COLORS[workoutStyle[0]] ?? "bg-gray-700 text-gray-300 border-gray-600"
                )}
              >
                {workoutStyle[0]}
              </span>
            )}
          </div>

          {mode === "powerlifting" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <span>벤치 {benchPress}</span>
              <span>데드 {deadlift}</span>
              <span>스쿼트 {squat}</span>
              {streak !== undefined && streak > 0 && (
                <span className="text-orange-400">🔥{streak}일</span>
              )}
            </div>
          )}

          {mode === "military" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              {runTime !== undefined && <span>🏃 {formatRunTime(runTime)}</span>}
              <span>팔굽 {pushups}</span>
              <span>윗몸 {situps}</span>
            </div>
          )}

          {mode === "inbody" && (
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <span>근육 {muscleMass}kg</span>
              <span>체지방 {bodyFatPct}%</span>
              {weightChangePct !== undefined && (
                <span className={weightChangePct <= 0 ? "text-success" : "text-danger"}>
                  {weightChangePct > 0 ? "+" : ""}{weightChangePct.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* 우측 점수/지표 */}
        <div className="flex-shrink-0 text-right">
          {mode === "powerlifting" && score !== undefined && (
            <div>
              {growthPct !== undefined ? (
                <span className={cn("text-sm font-bold", growthPct >= 0 ? "text-success" : "text-danger")}>
                  {growthPct >= 0 ? "+" : ""}{growthPct.toFixed(1)}%
                </span>
              ) : (
                <>
                  <div className="text-gold font-black text-lg">{total}</div>
                  <div className="text-[10px] text-gray-500">kg</div>
                </>
              )}
              <TierBadge score={score} showLabel={false} className="justify-end mt-0.5" />
            </div>
          )}
          {mode === "military" && grade && (
            <MilitaryGradeBadge grade={grade} />
          )}
          {mode === "inbody" && muscleMass !== undefined && (
            <div>
              <div className="text-gold font-black text-lg">{muscleMass}</div>
              <div className="text-[10px] text-gray-500">kg</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
