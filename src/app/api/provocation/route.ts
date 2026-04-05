import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unitCode = searchParams.get("unitCode");
  if (!unitCode) return NextResponse.json({ error: "unitCode 필요" }, { status: 400 });

  try {
    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) return NextResponse.json({ error: "존재하지 않는 부대" }, { status: 404 });

    const provocations = await prisma.provocation.findMany({
      where: {
        from: { unitId: unit.id },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        from: { select: { id: true, nickname: true, level: true } },
        to: { select: { id: true, nickname: true, level: true } },
      },
    });

    return NextResponse.json(provocations);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  try {
    const { toId, message } = await req.json();
    if (!toId || !message?.trim()) {
      return NextResponse.json({ error: "대상과 메시지를 입력해주세요" }, { status: 400 });
    }

    const provocation = await prisma.provocation.create({
      data: { fromId: session.memberId, toId, message: message.trim() },
      include: {
        from: { select: { id: true, nickname: true, level: true } },
        to: { select: { id: true, nickname: true, level: true } },
      },
    });

    // 도발 3회 업적 체크
    const count = await prisma.provocation.count({ where: { fromId: session.memberId } });
    if (count >= 3) await unlockAchievement(session.memberId, "PROVOCATION_SENT");

    return NextResponse.json(provocation);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
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
