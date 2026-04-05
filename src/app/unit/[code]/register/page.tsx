"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WORKOUT_STYLES, getMilitaryGrade, getPowerliftingScore, MILITARY_GRADE_BG } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "@/types";

const STEPS = ["레벨·스타일", "신병정보", "기록입력"];

export default function RegisterPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ level: 1, workoutStyle: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitCode: code, ...data }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "오류가 발생했습니다");
        return;
      }
      router.push(`/unit/${code}/ranking`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col p-6 pb-8">
      {/* 진행 바 */}
      <div className="flex gap-2 mb-8 mt-4">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-gold" : "bg-surface"
            )}
          />
        ))}
      </div>

      {step === 0 && (
        <Step1
          data={data}
          onUpdate={update}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <Step2
          data={data}
          onUpdate={update}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
          error={error}
        />
      )}
      {step === 2 && (
        <Step3
          data={data}
          onUpdate={update}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}

// ─── Step 1: 레벨 + 운동 스타일 ──────────────────────────────────
function Step1({
  data,
  onUpdate,
  onNext,
}: {
  data: OnboardingData;
  onUpdate: (p: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const levels = [
    { value: 1, label: "Lv.1 신병", desc: "헬스 입문자" },
    { value: 2, label: "Lv.2 이병", desc: "6개월 이하" },
    { value: 3, label: "Lv.3 일병", desc: "1년 이상" },
    { value: 4, label: "Lv.4 상병", desc: "운동 고수" },
  ];

  function toggleStyle(style: string) {
    const current = data.workoutStyle || [];
    if (current.includes(style)) {
      onUpdate({ workoutStyle: current.filter((s) => s !== style) });
    } else {
      onUpdate({ workoutStyle: [...current, style] });
    }
  }

  return (
    <div className="flex flex-col gap-6 flex-1">
      <div>
        <h2 className="text-2xl font-black">레벨 · 운동 스타일 선택</h2>
        <p className="text-gray-400 text-sm mt-1">부대: <span className="text-gold font-bold">전체</span></p>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-3">⭐ 레벨</p>
        <div className="grid grid-cols-2 gap-3">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => onUpdate({ level: l.value })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-colors",
                data.level === l.value
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border bg-card text-white"
              )}
            >
              <div className="font-bold">{l.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-3">💪 운동 스타일 (복수 선택)</p>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_STYLES.map((style) => {
            const selected = data.workoutStyle?.includes(style);
            return (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                  selected ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-gray-300"
                )}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1" />
      <Button
        variant="gold"
        size="lg"
        onClick={onNext}
        disabled={!data.level}
      >
        다음 →
      </Button>
    </div>
  );
}

// ─── Step 2: 신병 정보 ───────────────────────────────────────────
function Step2({
  data,
  onUpdate,
  onBack,
  onNext,
  error,
}: {
  data: OnboardingData;
  onUpdate: (p: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-6 flex-1">
      <div>
        <h2 className="text-2xl font-black">신병 정보 입력</h2>
        <div className="flex gap-2 mt-2">
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-lg">Lv.{data.level}</span>
          {data.workoutStyle?.[0] && (
            <span className="text-xs bg-pink-900/40 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-lg">{data.workoutStyle[0]}</span>
          )}
        </div>
      </div>

      <Input
        label="닉네임"
        placeholder="예: 불주먹킹"
        value={data.nickname || ""}
        onChange={(e) => onUpdate({ nickname: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="키 (cm)"
          type="number"
          placeholder="175"
          value={data.height || ""}
          onChange={(e) => onUpdate({ height: Number(e.target.value) })}
        />
        <Input
          label="몸무게 (kg)"
          type="number"
          placeholder="75"
          value={data.weight || ""}
          onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
        />
      </div>

      <Input
        label="🔒 비밀번호 (다른 기기 로그인 시 사용)"
        type="password"
        placeholder="비밀번호"
        value={data.password || ""}
        onChange={(e) => onUpdate({ password: e.target.value })}
      />

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex-1" />
      <div className="flex gap-3">
        <Button variant="dark" size="md" onClick={onBack} className="flex-1">
          ← 이전
        </Button>
        <Button
          variant="gold"
          size="md"
          onClick={onNext}
          disabled={!data.nickname?.trim() || !data.password}
          className="flex-1"
        >
          다음 →
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: 기록 입력 ───────────────────────────────────────────
function Step3({
  data,
  onUpdate,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  data: OnboardingData;
  onUpdate: (p: Partial<OnboardingData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  const [agreed, setAgreed] = useState(false);

  // 파워리프팅 점수 미리보기
  const plTotal =
    (data.benchPress || 0) + (data.deadlift || 0) + (data.squat || 0);
  const plScore = plTotal > 0 ? getPowerliftingScore(plTotal) : 0;

  // 군 체력 등급 미리보기
  const milGrade =
    data.runTime && data.pushups !== undefined && data.situps !== undefined
      ? getMilitaryGrade(data.runTime, data.pushups, data.situps)
      : null;

  // 뜀걸음 시간 입력 (MM:SS)
  const [runMin, setRunMin] = useState("");
  const [runSec, setRunSec] = useState("");

  function handleRunChange(min: string, sec: string) {
    setRunMin(min);
    setRunSec(sec);
    const totalSec = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0);
    if (totalSec > 0) onUpdate({ runTime: totalSec });
  }

  const type = data.recordType;

  return (
    <div className="flex flex-col gap-5 flex-1">
      <div>
        <h2 className="text-2xl font-black">기록 입력</h2>
        <p className="text-gray-400 text-sm mt-1">{data.nickname}, 어떤 기록을 입력할까요?</p>
      </div>

      {/* 카테고리 선택 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "powerlifting", label: "💪 파워리프팅", desc: "3대 1RM" },
          { key: "military", label: "⭐ 특급전사", desc: "군 체력" },
          { key: "inbody", label: "📊 인바디", desc: "체성분" },
        ].map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => onUpdate({ recordType: key as OnboardingData["recordType"] })}
            className={cn(
              "p-3 rounded-2xl border text-center transition-colors",
              type === key ? "border-gold bg-gold/10 text-gold" : "border-border bg-card text-gray-300"
            )}
          >
            <div className="text-xs font-bold">{label}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{desc}</div>
          </button>
        ))}
      </div>

      {/* 파워리프팅 */}
      {type === "powerlifting" && (
        <div className="flex flex-col gap-3">
          <Input label="🏋️ 벤치프레스" type="number" placeholder="kg" value={data.benchPress || ""} onChange={(e) => onUpdate({ benchPress: Number(e.target.value) })} />
          <Input label="⚡ 데드리프트" type="number" placeholder="kg" value={data.deadlift || ""} onChange={(e) => onUpdate({ deadlift: Number(e.target.value) })} />
          <Input label="🦵 스쿼트" type="number" placeholder="kg" value={data.squat || ""} onChange={(e) => onUpdate({ squat: Number(e.target.value) })} />
          {plScore > 0 && <ScorePreview score={plScore} label={["", "하린이", "헬린이", "평균전사", "헬스 고인물", "체단실 괴물"][plScore]} />}
        </div>
      )}

      {/* 특급전사 */}
      {type === "military" && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-gray-400 mb-2">🏃 뜀걸음 3km</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="분"
                value={runMin}
                onChange={(e) => handleRunChange(e.target.value, runSec)}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-white text-center"
                max={59}
              />
              <span className="text-gray-400">:</span>
              <input
                type="number"
                placeholder="초"
                value={runSec}
                onChange={(e) => handleRunChange(runMin, e.target.value)}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-white text-center"
                max={59}
              />
            </div>
          </div>
          <Input label="💪 팔굽혀펴기 (2분 횟수)" type="number" placeholder="개" value={data.pushups ?? ""} onChange={(e) => onUpdate({ pushups: Number(e.target.value) })} />
          <Input label="🦴 윗몸일으키기 (2분 횟수)" type="number" placeholder="개" value={data.situps ?? ""} onChange={(e) => onUpdate({ situps: Number(e.target.value) })} />
          {milGrade && (
            <div className={cn("p-4 rounded-2xl text-center", milGrade.grade === "특급" ? "bg-yellow-900/20 border border-yellow-700" : "bg-card border border-border")}>
              <span className={cn("text-2xl font-black", MILITARY_GRADE_BG[milGrade.grade]?.includes("yellow") ? "text-yellow-400" : "text-white")}>
                {milGrade.grade}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 인바디 */}
      {type === "inbody" && (
        <div className="flex flex-col gap-3">
          <Input label="💪 골격근량 (kg)" type="number" placeholder="kg" value={data.muscleMass || ""} onChange={(e) => onUpdate({ muscleMass: Number(e.target.value) })} />
          <Input label="🔥 체지방률 (%)" type="number" placeholder="%" value={data.bodyFatPct || ""} onChange={(e) => onUpdate({ bodyFatPct: Number(e.target.value) })} />
          <Input label="⚖️ 체중 (kg)" type="number" placeholder="kg" value={data.weight || ""} onChange={(e) => onUpdate({ weight: Number(e.target.value) })} />
        </div>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}

      {/* 동의 */}
      <label className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-gold w-4 h-4"
        />
        <span className="text-xs text-gray-400 leading-relaxed">
          본인은 위 정보(닉네임, 신체 정보, 운동 기록)를 본 서비스에 자발적으로 제공하는 것에 동의합니다.
        </span>
      </label>

      <div className="flex gap-3">
        <Button variant="dark" size="md" onClick={onBack} className="flex-1">
          ← 이전
        </Button>
        <Button
          variant="gold"
          size="md"
          onClick={onSubmit}
          disabled={loading || !agreed}
          className="flex-1"
        >
          {loading ? "등록 중..." : "⭐ 등록 완료"}
        </Button>
      </div>
    </div>
  );
}

function ScorePreview({ score, label }: { score: number; label: string }) {
  const emojis = ["", "🐣", "⚔️", "💪", "🦁", "👹"];
  const colors = ["", "text-gray-400", "text-blue-400", "text-purple-400", "text-orange-400", "text-yellow-400"];
  return (
    <div className="p-4 rounded-2xl bg-card border border-border text-center">
      <div className="text-3xl">{emojis[score]}</div>
      <div className={cn("text-2xl font-black mt-1", colors[score])}>{score}점</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}
