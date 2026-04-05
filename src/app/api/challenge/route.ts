import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { drawRandomChallenge } from "@/lib/challenges";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await prisma.dailyChallenge.findFirst({
      where: {
        memberId: session.memberId,
        drawnAt: { gte: today, lt: tomorrow },
      },
    });

    if (existing) return NextResponse.json(existing);

    const challenge = drawRandomChallenge();
    const record = await prisma.dailyChallenge.create({
      data: { memberId: session.memberId, challenge },
    });

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
