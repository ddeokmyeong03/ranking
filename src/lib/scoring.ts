// ─── 파워리프팅 점수 ─────────────────────────────────────────────
export function getPowerliftingScore(total: number): number {
  if (total < 150) return 1;
  if (total < 250) return 2;
  if (total < 350) return 3;
  if (total < 450) return 4;
  return 5;
}

export const POWERLIFTING_TIER_LABELS: Record<number, string> = {
  1: "하린이",
  2: "헬린이",
  3: "평균전사",
  4: "헬스 고인물",
  5: "체단실 괴물",
};

export const POWERLIFTING_TIER_EMOJIS: Record<number, string> = {
  1: "🐣",
  2: "⚔️",
  3: "💪",
  4: "🦁",
  5: "👹",
};

// ─── 군 체력 등급 ────────────────────────────────────────────────
export interface MilitaryGradeResult {
  grade: string;
  gradeScore: number;
}

export function getMilitaryGrade(
  runTime: number,
  pushups: number,
  situps: number
): MilitaryGradeResult {
  // runTime in seconds. ALL three must meet threshold.
  if (runTime < 750 && pushups >= 72 && situps >= 86) {
    return { grade: "특급", gradeScore: 4 };
  }
  if (runTime < 810 && pushups >= 58 && situps >= 72) {
    return { grade: "1급", gradeScore: 3 };
  }
  if (runTime < 900 && pushups >= 44 && situps >= 58) {
    return { grade: "2급", gradeScore: 2 };
  }
  return { grade: "3급", gradeScore: 1 };
}

export const MILITARY_GRADE_COLORS: Record<string, string> = {
  특급: "text-yellow-400",
  "1급": "text-blue-400",
  "2급": "text-green-400",
  "3급": "text-gray-400",
};

export const MILITARY_GRADE_BG: Record<string, string> = {
  특급: "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40",
  "1급": "bg-blue-400/20 text-blue-400 border border-blue-400/40",
  "2급": "bg-green-400/20 text-green-400 border border-green-400/40",
  "3급": "bg-gray-600/20 text-gray-400 border border-gray-600/40",
};

// MM:SS → seconds
export function parseRunTime(mmss: string): number {
  const [m, s] = mmss.split(":").map(Number);
  return m * 60 + (s || 0);
}

// seconds → "MM:SS"
export function formatRunTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── 레벨 배지 ───────────────────────────────────────────────────
export const LEVEL_LABELS: Record<number, string> = {
  1: "신병",
  2: "이병",
  3: "일병",
  4: "상병",
};

// ─── 운동 스타일 ─────────────────────────────────────────────────
export const WORKOUT_STYLES = [
  "파워형",
  "지구형",
  "균형형",
  "상체형",
  "하체형",
  "코어형",
  "다이어트형",
  "벌크형",
  "기타",
] as const;

export type WorkoutStyle = (typeof WORKOUT_STYLES)[number];

export const WORKOUT_STYLE_COLORS: Record<string, string> = {
  파워형: "bg-red-900/40 text-red-300 border-red-800",
  지구형: "bg-blue-900/40 text-blue-300 border-blue-800",
  균형형: "bg-purple-900/40 text-purple-300 border-purple-800",
  상체형: "bg-orange-900/40 text-orange-300 border-orange-800",
  하체형: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  코어형: "bg-green-900/40 text-green-300 border-green-800",
  다이어트형: "bg-pink-900/40 text-pink-300 border-pink-800",
  벌크형: "bg-amber-900/40 text-amber-300 border-amber-800",
  기타: "bg-gray-700/40 text-gray-300 border-gray-600",
};
