import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const { muscleMass, bodyFatPct, weight } = await req.json();

    if (!muscleMass || !bodyFatPct || !weight) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요" }, { status: 400 });
    }

    // 첫 기록 기준 체중 변화율 계산
    const firstRecord = await prisma.inbodyRecord.findFirst({
      where: { memberId: session.memberId },
      orderBy: { recordedAt: "asc" },
    });

    const weightChangePct = firstRecord
      ? ((Number(weight) - firstRecord.weight) / firstRecord.weight) * 100
      : 0;

    const record = await prisma.inbodyRecord.create({
      data: {
        memberId: session.memberId,
        muscleMass: Number(muscleMass),
        bodyFatPct: Number(bodyFatPct),
        weight: Number(weight),
        weightChangePct,
      },
    });

    // 첫 인바디 업적
    if (!firstRecord) await unlockAchievement(session.memberId, "FIRST_INBODY");

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
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
