import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);

    const [sent, received] = await Promise.all([
      prisma.dutyChangeRequest.findMany({
        where: { requesterId: session.memberId },
        include: {
          targetMember: { select: { id: true, name: true, rank: true } },
          requesterAssignment: { select: { date: true, dutyType: true } },
          targetAssignment: { select: { date: true, dutyType: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dutyChangeRequest.findMany({
        where: { targetMemberId: session.memberId },
        include: {
          requester: { select: { id: true, name: true, rank: true } },
          requesterAssignment: { select: { date: true, dutyType: true } },
          targetAssignment: { select: { date: true, dutyType: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ sent, received });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { requesterAssignmentId, targetAssignmentId, message } = await req.json();

    if (!requesterAssignmentId || !targetAssignmentId) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const [requesterAssignment, targetAssignment] = await Promise.all([
      prisma.dutyAssignment.findUnique({
        where: { id: requesterAssignmentId },
        include: { member: { select: { name: true, rank: true } } },
      }),
      prisma.dutyAssignment.findUnique({
        where: { id: targetAssignmentId },
        include: { member: { select: { id: true, name: true, rank: true } } },
      }),
    ]);

    if (!requesterAssignment || requesterAssignment.memberId !== session.memberId) {
      return NextResponse.json({ error: "본인의 근무만 요청할 수 있습니다." }, { status: 403 });
    }

    if (!targetAssignment || targetAssignment.unitId !== session.unitId) {
      return NextResponse.json({ error: "대상 근무를 찾을 수 없습니다." }, { status: 404 });
    }

    if (targetAssignment.memberId === session.memberId) {
      return NextResponse.json({ error: "본인에게는 요청할 수 없습니다." }, { status: 400 });
    }

    // 상대방 휴가/휴무 여부 확인
    const targetLeave = await prisma.memberLeave.findFirst({
      where: {
        memberId: targetAssignment.memberId,
        startDate: { lte: targetAssignment.date },
        endDate: { gte: targetAssignment.date },
      },
    });

    if (targetLeave) {
      const leaveLabel = targetLeave.leaveType === "VACATION" ? "휴가" : "휴무";
      return NextResponse.json(
        {
          error: `상대방이 해당 날짜에 ${leaveLabel} 중이므로 당직을 교환할 수 없습니다.`,
          blockedByLeave: true,
        },
        { status: 409 }
      );
    }

    const request = await prisma.dutyChangeRequest.create({
      data: {
        requesterId: session.memberId,
        requesterAssignmentId,
        targetMemberId: targetAssignment.memberId,
        targetAssignmentId,
        message,
      },
    });

    const requesterDateStr = format(requesterAssignment.date, "M월 d일 (eee)", { locale: ko });
    const targetDateStr = format(targetAssignment.date, "M월 d일 (eee)", { locale: ko });

    await sendNotification(targetAssignment.memberId, NotificationType.REQUEST_RECEIVED, {
      title: "당직 변경 요청이 도착했습니다",
      body: `${requesterAssignment.member.rank} ${requesterAssignment.member.name}님이 ${requesterDateStr} 근무인데 ${targetDateStr}과 변경을 희망합니다.`,
      data: { requestId: request.id },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
