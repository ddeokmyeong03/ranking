export interface UnitInfo {
  id: string;
  code: string;
  name: string;
  memberCount: number;
}

export interface MemberInfo {
  id: string;
  unitId: string;
  nickname: string;
  height: number | null;
  weight: number | null;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  createdAt: string;
}

export interface PowerliftingRankEntry {
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
  recordedAt: string;
  streak?: number;
  achievements?: string[];
}

export interface MilitaryRankEntry {
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
  recordedAt: string;
}

export interface InbodyRankEntry {
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
  recordedAt: string;
}

export type RankingFilter =
  | "total"
  | "team"
  | "level"
  | "style"
  | "growth"
  | "attendance";

export type MilitaryFilter = "grade" | "run" | "pushup" | "situp";

export type InbodyFilter = "muscle" | "fat" | "change";

export interface AchievementInfo {
  key: string;
  nameKo: string;
  descriptionKo: string;
  iconEmoji: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface OnboardingData {
  level?: number;
  workoutStyle?: string[];
  nickname?: string;
  height?: number;
  weight?: number;
  password?: string;
  photoUrl?: string;
  benchPress?: number;
  deadlift?: number;
  squat?: number;
  runTime?: number;
  pushups?: number;
  situps?: number;
  muscleMass?: number;
  bodyFatPct?: number;
  recordType?: "powerlifting" | "military" | "inbody" | "skip";
}
