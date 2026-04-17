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

    const leaveStart = new Date(startDate);
    const leaveEnd = new Date(endDate);

    const leave = await prisma.memberLeave.create({
      data: {
        memberId,
        startDate: leaveStart,
        endDate: leaveEnd,
        leaveType,
        reason: reason ?? null,
      },
      include: { member: { select: { id: true, name: true, rank: true } } },
    });

    // 해당 기간 내 배정된 근무를 조회하여 아직 변경 희망이 없는 것들을 자동 등록
    const dutiesInPeriod = await prisma.dutyAssignment.findMany({
      where: {
        memberId,
        date: { gte: leaveStart, lte: leaveEnd },
      },
    });

    const autoListingIds: string[] = [];
    for (const duty of dutiesInPeriod) {
      // 이미 OPEN 상태 변경 희망 게시글이 있으면 스킵
      const existing = await prisma.dutyChangeListing.findFirst({
        where: { assignmentId: duty.id, status: "OPEN" },
      });
      if (existing) continue;

      await prisma.dutyChangeListing.create({
        data: {
          assignmentId: duty.id,
          posterId: memberId,
          message: `${leaveType === "VACATION" ? "휴가" : "휴무"} 로 인한 자동 변경 희망 등록`,
          status: "OPEN",
        },
      });
      autoListingIds.push(duty.id);
    }

    return NextResponse.json(
      { ...leave, autoListingCount: autoListingIds.length },
      { status: 201 }
    );
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
