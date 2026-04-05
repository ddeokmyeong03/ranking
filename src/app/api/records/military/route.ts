import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getMilitaryGrade } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const { runTime, pushups, situps } = await req.json();

    if (runTime === undefined || pushups === undefined || situps === undefined) {
      return NextResponse.json({ error: "모든 항목을 입력해주세요" }, { status: 400 });
    }

    const { grade, gradeScore } = getMilitaryGrade(Number(runTime), Number(pushups), Number(situps));

    const record = await prisma.militaryRecord.create({
      data: {
        memberId: session.memberId,
        runTime: Number(runTime),
        pushups: Number(pushups),
        situps: Number(situps),
        grade,
        gradeScore,
      },
    });

    // 업적 체크
    if (grade === "특급") await unlockAchievement(session.memberId, "MILITARY_특급");

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
