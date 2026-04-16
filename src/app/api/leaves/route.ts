import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { LeaveType } from "@prisma/client";

// GET: 내 휴가/휴무 목록 (또는 관리자는 부대 전체)
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let whereClause: Record<string, unknown> = {};

    // 관리자는 특정 멤버 조회 가능, 일반 사용자는 자신만
    if (session.role === "UNIT_ADMIN" && memberId) {
      whereClause.memberId = memberId;
    } else {
      whereClause.memberId = session.memberId;
    }

    if (year && month) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);
      whereClause = {
        ...whereClause,
        OR: [
          { startDate: { gte: start, lte: end } },
          { endDate: { gte: start, lte: end } },
          { startDate: { lte: start }, endDate: { gte: end } },
        ],
      };
    }

    const leaves = await prisma.memberLeave.findMany({
      where: whereClause,
      include: { member: { select: { id: true, name: true, rank: true } } },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(leaves);
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST: 휴가/휴무 등록
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { startDate, endDate, leaveType, reason, memberId: targetMemberId } = await req.json();

    if (!startDate || !endDate || !leaveType) {
      return NextResponse.json({ error: "시작일, 종료일, 유형은 필수입니다." }, { status: 400 });
    }

    if (!Object.values(LeaveType).includes(leaveType)) {
      return NextResponse.json({ error: "유효하지 않은 휴가 유형입니다." }, { status: 400 });
    }

    // 관리자는 다른 멤버의 휴가도 등록 가능
    const memberId =
      session.role === "UNIT_ADMIN" && targetMemberId
        ? targetMemberId
        : session.memberId;

    const leave = await prisma.memberLeave.create({
      data: {
        memberId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType,
        reason: reason ?? null,
      },
      include: { member: { select: { id: true, name: true, rank: true } } },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
