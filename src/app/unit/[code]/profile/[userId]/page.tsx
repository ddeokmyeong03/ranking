"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, ArrowLeft } from "lucide-react";
import LevelBadge from "@/components/ranking/LevelBadge";
import { WORKOUT_STYLE_COLORS } from "@/lib/scoring";
import { cn, formatRunTime } from "@/lib/utils";

interface ProfileData {
  id: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  height: number | null;
  weight: number | null;
  unitName: string;
  achievements: Achievement[];
  powerliftingHistory: PLRecord[];
  militaryHistory: MilRecord[];
  inbodyHistory: InbodyRecord[];
}

interface Achievement { key: string; nameKo: string; iconEmoji: string; unlocked: boolean; }
interface PLRecord { id: string; benchPress: number; deadlift: number; squat: number; total: number; score: number; recordedAt: string; }
interface MilRecord { id: string; runTime: number; pushups: number; situps: number; grade: string; recordedAt: string; }
interface InbodyRecord { id: string; muscleMass: number; bodyFatPct: number; weight: number; weightChangePct: number; recordedAt: string; }

export default function UserProfilePage() {
  const { userId } = useParams() as { code: string; userId: string };
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<"powerlifting" | "military" | "inbody">("powerlifting");
  const [session, setSession] = useState<{ memberId: string } | null>(null);
  const [showProvocationForm, setShowProvocationForm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then(setSession);
    fetch(`/api/profile?memberId=${userId}`).then((r) => r.json()).then(setProfile);
  }, [userId]);

  async function sendProvocation() {
    const res = await fetch("/api/provocation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toId: userId, message }),
    });
    if (res.ok) {
      setShowProvocationForm(false);
      setMessage("");
    }
  }

  if (!profile) return <div className="p-4 text-center text-gray-500 pt-12">불러오는 중...</div>;

  const latestPL = profile.powerliftingHistory[0];
  const latestMil = profile.militaryHistory[0];
  const latestInbody = profile.inbodyHistory[0];

  return (
    <div className="p-4 flex flex-col gap-4 pb-8">
      {/* 상단 네비 */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-black text-lg">{profile.nickname}의 기록</h1>
      </div>

      {/* 프로필 */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt={profile.nickname} className="w-full h-full object-cover" />
          ) : (
            <User size={28} className="text-gray-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black">{profile.nickname}</h2>
            <LevelBadge level={profile.level} />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {profile.workoutStyle.map((s) => (
              <span key={s} className={cn("text-[10px] px-2 py-0.5 rounded-lg border", WORKOUT_STYLE_COLORS[s])}>{s}</span>
            ))}
          </div>
          {(profile.height || profile.weight) && (
            <p className="text-xs text-gray-500 mt-1">
              {profile.height && `${profile.height}cm`} {profile.weight && `${profile.weight}kg`}
            </p>
          )}
        </div>
        {session && session.memberId !== userId && (
          <button
            onClick={() => setShowProvocationForm(true)}
            className="text-xs bg-red-900/40 border border-red-800 text-red-400 px-3 py-2 rounded-xl font-bold"
          >
            😈 도발
          </button>
        )}
      </div>

      {/* 최신 기록 요약 */}
      <div className="grid grid-cols-3 gap-2">
        {latestPL && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">💪 3대</p>
            <p className="text-gold font-black text-lg">{latestPL.total}kg</p>
          </div>
        )}
        {latestMil && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">⭐ 특급전사</p>
            <p className={`font-black text-lg ${latestMil.grade === "특급" ? "text-yellow-400" : latestMil.grade === "1급" ? "text-blue-400" : "text-green-400"}`}>
              {latestMil.grade}
            </p>
          </div>
        )}
        {latestInbody && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">📊 근육</p>
            <p className="text-blue-400 font-black text-lg">{latestInbody.muscleMass}kg</p>
          </div>
        )}
      </div>

      {/* 기록 탭 */}
      <div className="flex gap-2">
        {["powerlifting", "military", "inbody"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as typeof activeTab)}
            className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === t ? "bg-gold text-black" : "bg-surface border border-border text-gray-400")}>
            {t === "powerlifting" ? "💪 3대" : t === "military" ? "⭐ 특급전사" : "📊 인바디"}
          </button>
        ))}
      </div>

      {activeTab === "powerlifting" && (
        <div className="flex flex-col gap-2">
          {profile.powerliftingHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between">
                <span className="text-gold font-black">{r.total}kg</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">벤치 {r.benchPress} · 데드 {r.deadlift} · 스쿼트 {r.squat}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "military" && (
        <div className="flex flex-col gap-2">
          {profile.militaryHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between">
                <span className={`font-black ${r.grade === "특급" ? "text-yellow-400" : r.grade === "1급" ? "text-blue-400" : "text-green-400"}`}>{r.grade}</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">🏃 {formatRunTime(r.runTime)} · 팔굽 {r.pushups} · 윗몸 {r.situps}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "inbody" && (
        <div className="flex flex-col gap-2">
          {profile.inbodyHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between">
                <span className="text-blue-400 font-black">{r.muscleMass}kg</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">체지방 {r.bodyFatPct}% · 체중 {r.weight}kg</div>
            </div>
          ))}
        </div>
      )}

      {/* 업적 */}
      <div>
        <h3 className="font-bold mb-2">🎖️ 업적</h3>
        <div className="flex flex-wrap gap-2">
          {profile.achievements.filter(a => a.unlocked).map((a) => (
            <div key={a.key} className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-xl px-3 py-1.5">
              <span>{a.iconEmoji}</span>
              <span className="text-xs font-bold text-gold">{a.nameKo}</span>
            </div>
          ))}
          {profile.achievements.filter(a => a.unlocked).length === 0 && (
            <p className="text-gray-500 text-sm">아직 업적이 없습니다</p>
          )}
        </div>
      </div>

      {/* 도발 모달 */}
      {showProvocationForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-surface border-t border-border rounded-t-3xl p-6 w-full">
            <h3 className="text-lg font-black mb-2">😈 {profile.nickname}에게 도발</h3>
            <textarea
              placeholder="도발 메시지를 입력하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button onClick={() => setShowProvocationForm(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold">취소</button>
              <button onClick={sendProvocation} disabled={!message.trim()} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50">
                😈 도발 날리기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
