import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPowerliftingScore } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const { benchPress, deadlift, squat } = await req.json();

    if (!benchPress || !deadlift || !squat) {
      return NextResponse.json({ error: "벤치/데드/스쿼트를 모두 입력해주세요" }, { status: 400 });
    }

    const total = Number(benchPress) + Number(deadlift) + Number(squat);
    const score = getPowerliftingScore(total);

    const record = await prisma.powerliftingRecord.create({
      data: {
        memberId: session.memberId,
        benchPress: Number(benchPress),
        deadlift: Number(deadlift),
        squat: Number(squat),
        total,
        score,
      },
    });

    // 업적 체크
    await checkPowerliftingAchievements(session.memberId, total, session.unitId);

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

async function checkPowerliftingAchievements(memberId: string, total: number, unitId: string) {
  if (total >= 150) await unlockAchievement(memberId, "TIER_2");
  if (total >= 450) await unlockAchievement(memberId, "TIER_5");

  // 랭킹 1위 체크
  const topRecord = await prisma.$queryRaw<{ memberId: string }[]>`
    SELECT DISTINCT ON (m.id) m.id as "memberId", r.total
    FROM "Member" m
    JOIN "PowerliftingRecord" r ON r."memberId" = m.id
    WHERE m."unitId" = ${unitId}
    ORDER BY m.id, r."recordedAt" DESC
  `;
  if (topRecord.length > 0 && topRecord[0].memberId === memberId) {
    await unlockAchievement(memberId, "RANK_1");
  }
}

async function unlockAchievement(memberId: string, key: string) {
  try {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return;
    await prisma.memberAchievement.upsert({
      where: { memberId_achievementId: { memberId, achievementId: achievement.id } },
      update: {},
      create: { memberId, achievementId: achievement.id },
    });
  } catch { /* ignore */ }
}
