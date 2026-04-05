import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const achievements = [
  { key: "FIRST_RECORD",    nameKo: "첫 기록",        descriptionKo: "첫 번째 기록을 등록했습니다",           iconEmoji: "⭐" },
  { key: "TIER_2",          nameKo: "헬린이 탈출",     descriptionKo: "총합 150kg을 돌파했습니다",             iconEmoji: "💯" },
  { key: "TIER_5",          nameKo: "체단실 괴물",     descriptionKo: "총합 450kg을 돌파했습니다",             iconEmoji: "🔥" },
  { key: "MILITARY_특급",   nameKo: "특급전사",        descriptionKo: "군사체력 특급을 달성했습니다",          iconEmoji: "💀" },
  { key: "STREAK_7",        nameKo: "7일 연속",        descriptionKo: "7일 연속 출석했습니다",                 iconEmoji: "👑" },
  { key: "STREAK_30",       nameKo: "한 달 전사",      descriptionKo: "30일 연속 출석했습니다",                iconEmoji: "🦁" },
  { key: "PROVOCATION_SENT",nameKo: "도발의 달인",     descriptionKo: "3번 이상 도발을 보냈습니다",            iconEmoji: "😈" },
  { key: "RANK_1",          nameKo: "랭킹 1위",        descriptionKo: "부대 파워리프팅 1위를 달성했습니다",    iconEmoji: "🥇" },
  { key: "FIRST_INBODY",    nameKo: "인바디 도전",     descriptionKo: "첫 인바디를 등록했습니다",              iconEmoji: "📊" },
  { key: "WEEKLY_KING",     nameKo: "이주의 갱신왕",   descriptionKo: "이번 주 기록 갱신 1위를 달성했습니다",  iconEmoji: "🏆" },
];

async function main() {
  console.log("업적 시드 데이터 입력 중...");
  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
    console.log(`  ✓ ${ach.iconEmoji} ${ach.nameKo}`);
  }
  console.log("완료!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
