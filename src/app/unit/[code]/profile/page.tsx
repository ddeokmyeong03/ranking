"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "lucide-react";
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
  unitCode: string;
  unitName: string;
  achievements: Achievement[];
  powerliftingHistory: PLRecord[];
  militaryHistory: MilRecord[];
  inbodyHistory: InbodyRecord[];
  provocationsReceived: Provocation[];
}

interface Achievement {
  key: string;
  nameKo: string;
  descriptionKo: string;
  iconEmoji: string;
  unlocked: boolean;
}

interface PLRecord {
  id: string;
  benchPress: number;
  deadlift: number;
  squat: number;
  total: number;
  score: number;
  recordedAt: string;
}

interface MilRecord {
  id: string;
  runTime: number;
  pushups: number;
  situps: number;
  grade: string;
  recordedAt: string;
}

interface InbodyRecord {
  id: string;
  muscleMass: number;
  bodyFatPct: number;
  weight: number;
  weightChangePct: number;
  recordedAt: string;
}

interface Provocation {
  id: string;
  message: string;
  createdAt: string;
  from: { id: string; nickname: string; level: number };
}

export default function MyProfilePage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [streak, setStreak] = useState(0);
  const [todayChecked, setTodayChecked] = useState(false);
  const [session, setSession] = useState<{ memberId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"powerlifting" | "military" | "inbody">("powerlifting");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginNickname, setLoginNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((s) => {
        setSession(s);
        if (s?.memberId) {
          loadProfile(s.memberId);
          fetch(`/api/attendance?memberId=${s.memberId}`).then((r) => r.json()).then((d) => {
            setStreak(d.streak || 0);
            setTodayChecked(d.todayChecked || false);
          });
        }
      });
  }, []);

  function loadProfile(memberId: string) {
    fetch(`/api/profile?memberId=${memberId}`).then((r) => r.json()).then(setProfile);
  }

  async function checkIn() {
    const res = await fetch("/api/attendance", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setStreak(d.streak);
      setTodayChecked(true);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitCode: code, nickname: loginNickname, password: loginPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error || "로그인 실패");
      return;
    }
    setShowLoginModal(false);
    window.location.reload();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (!session) {
    return (
      <div className="p-6 flex flex-col items-center gap-6 pt-12">
        <div className="text-5xl">🔒</div>
        <div className="text-center">
          <h2 className="text-xl font-black">로그인이 필요합니다</h2>
          <p className="text-gray-400 text-sm mt-2">내 기록을 보려면 로그인하세요</p>
        </div>
        <button
          onClick={() => setShowLoginModal(true)}
          className="bg-gold text-black font-bold px-8 py-3 rounded-2xl"
        >
          로그인
        </button>
        <button
          onClick={() => router.push(`/unit/${code}/register`)}
          className="text-gray-400 text-sm"
        >
          아직 등록 안 했나요? 등록하기 →
        </button>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end z-50">
            <form onSubmit={handleLogin} className="bg-surface border-t border-border rounded-t-3xl p-6 w-full">
              <h3 className="text-lg font-black mb-4">로그인</h3>
              <div className="flex flex-col gap-3">
                <input placeholder="닉네임" value={loginNickname} onChange={(e) => setLoginNickname(e.target.value)}
                  className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
                <input type="password" placeholder="비밀번호" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-card border border-border rounded-xl px-4 py-3 text-white" />
                {loginError && <p className="text-danger text-sm">{loginError}</p>}
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl bg-card border border-border text-sm font-bold">취소</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gold text-black text-sm font-bold">로그인</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center text-gray-500 pt-12">불러오는 중...</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-8">
      {/* 프로필 카드 */}
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
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black">{profile.nickname}</h2>
            <LevelBadge level={profile.level} />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {profile.workoutStyle.map((s) => (
              <span key={s} className={cn("text-[10px] px-2 py-0.5 rounded-lg border", WORKOUT_STYLE_COLORS[s])}>{s}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{profile.unitName}</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500">로그아웃</button>
      </div>

      {/* 출석 */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">🔥 출석 스트릭</p>
          <p className="text-2xl font-black text-orange-400 mt-1">{streak}일 연속</p>
        </div>
        <button
          onClick={checkIn}
          disabled={todayChecked}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
            todayChecked ? "bg-success/20 text-success border border-success/40" : "bg-gold text-black"
          )}
        >
          {todayChecked ? "✓ 출석완료" : "출석체크"}
        </button>
      </div>

      {/* 기록 탭 */}
      <div className="flex gap-2">
        {["powerlifting", "military", "inbody"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as typeof activeTab)}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === t ? "bg-gold text-black" : "bg-surface border border-border text-gray-400"
            )}
          >
            {t === "powerlifting" ? "💪 3대" : t === "military" ? "⭐ 특급전사" : "📊 인바디"}
          </button>
        ))}
      </div>

      {/* 기록 히스토리 */}
      {activeTab === "powerlifting" && (
        <div className="flex flex-col gap-2">
          {profile.powerliftingHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">기록 없음</p>
          ) : profile.powerliftingHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-gold font-black">{r.total}kg</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                벤치 {r.benchPress} · 데드 {r.deadlift} · 스쿼트 {r.squat}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "military" && (
        <div className="flex flex-col gap-2">
          {profile.militaryHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">기록 없음</p>
          ) : profile.militaryHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-yellow-400">{r.grade}</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                🏃 {formatRunTime(r.runTime)} · 팔굽 {r.pushups} · 윗몸 {r.situps}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "inbody" && (
        <div className="flex flex-col gap-2">
          {profile.inbodyHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">기록 없음</p>
          ) : profile.inbodyHistory.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="font-black text-blue-400">{r.muscleMass}kg 근육</span>
                <span className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleDateString("ko")}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                체지방 {r.bodyFatPct}% · 체중 {r.weight}kg
                {r.weightChangePct !== 0 && (
                  <span className={r.weightChangePct <= 0 ? " text-success" : " text-danger"}>
                    {" "}({r.weightChangePct > 0 ? "+" : ""}{r.weightChangePct.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업적 */}
      <div>
        <h3 className="font-bold mb-3">🎖️ 업적 ({profile.achievements.filter(a => a.unlocked).length}/{profile.achievements.length})</h3>
        <div className="grid grid-cols-2 gap-2">
          {profile.achievements.map((a) => (
            <div
              key={a.key}
              className={cn(
                "p-3 rounded-2xl border",
                a.unlocked ? "border-gold/40 bg-gold/5" : "border-border bg-card opacity-50"
              )}
            >
              <span className="text-2xl">{a.iconEmoji}</span>
              <p className="text-sm font-bold mt-1">{a.nameKo}</p>
              <p className="text-[10px] text-gray-500">{a.descriptionKo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 받은 도발 */}
      {profile.provocationsReceived.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">🔥 내가 받은 도발 ({profile.provocationsReceived.length})</h3>
          <div className="flex flex-col gap-2">
            {profile.provocationsReceived.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <LevelBadge level={p.from.level} />
                  <span className="text-sm font-bold text-red-400">{p.from.nickname}</span>
                </div>
                <p className="text-sm text-gray-300">{p.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
