import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.attendance.upsert({
      where: { memberId_date: { memberId: session.memberId, date: today } },
      update: {},
      create: { memberId: session.memberId, date: today },
    });

    const streak = await getStreak(session.memberId);

    // 업적 체크
    if (streak >= 7) await unlockAchievement(session.memberId, "STREAK_7");
    if (streak >= 30) await unlockAchievement(session.memberId, "STREAK_30");

    return NextResponse.json({ streak, todayChecked: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId 필요" }, { status: 400 });

  const streak = await getStreak(memberId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = await prisma.attendance.findUnique({
    where: { memberId_date: { memberId, date: today } },
  });

  return NextResponse.json({ streak, todayChecked: !!todayRecord });
}

async function getStreak(memberId: string): Promise<number> {
  const records = await prisma.attendance.findMany({
    where: { memberId },
    orderBy: { date: "desc" },
    take: 365,
  });

  if (records.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = today.getTime();

  for (const r of records) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      cursor = d.getTime();
    } else {
      break;
    }
  }
  return streak;
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
