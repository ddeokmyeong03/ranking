import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const session = await getSession();
  const targetId = memberId || session?.memberId;
  if (!targetId) return NextResponse.json({ error: "memberId 필요" }, { status: 400 });

  try {
    const member = await prisma.member.findUnique({
      where: { id: targetId },
      include: {
        unit: true,
        achievements: { include: { achievement: true } },
        powerliftingRecords: { orderBy: { recordedAt: "desc" }, take: 15 },
        militaryRecords: { orderBy: { recordedAt: "desc" }, take: 15 },
        inbodyRecords: { orderBy: { recordedAt: "desc" }, take: 15 },
      },
    });

    if (!member) return NextResponse.json({ error: "멤버를 찾을 수 없습니다" }, { status: 404 });

    const unlockedKeys = new Set(member.achievements.map((a) => a.achievement.key));
    const achievementList = ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlockedKeys.has(a.key),
      unlockedAt: member.achievements.find((ua) => ua.achievement.key === a.key)?.unlockedAt,
    }));

    // 받은 도발
    const provocationsReceived = await prisma.provocation.findMany({
      where: { toId: targetId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { from: { select: { id: true, nickname: true, level: true } } },
    });

    return NextResponse.json({
      id: member.id,
      nickname: member.nickname,
      level: member.level,
      workoutStyle: member.workoutStyle,
      photoUrl: member.photoUrl,
      height: member.height,
      weight: member.weight,
      unitCode: member.unit.code,
      unitName: member.unit.name,
      achievements: achievementList,
      powerliftingHistory: member.powerliftingRecords,
      militaryHistory: member.militaryRecords,
      inbodyHistory: member.inbodyRecords,
      provocationsReceived,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
