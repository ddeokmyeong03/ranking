import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const { action } = await req.json(); // "approve" | "reject"

    const request = await prisma.dutyChangeRequest.findUnique({
      where: { id },
      include: {
        requesterAssignment: true,
        targetAssignment: true,
        requester: { select: { id: true, name: true, rank: true } },
        targetMember: { select: { id: true, name: true, rank: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 });
    }

    if (request.targetMemberId !== session.memberId) {
      return NextResponse.json({ error: "수신자만 처리할 수 있습니다." }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 요청입니다." }, { status: 409 });
    }

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.dutyAssignment.update({
          where: { id: request.requesterAssignmentId },
          data: {
            memberId: request.targetMemberId,
            isSwapped: true,
            originalMemberId: request.requesterId,
          },
        });

        await tx.dutyAssignment.update({
          where: { id: request.targetAssignmentId },
          data: {
            memberId: request.requesterId,
            isSwapped: true,
            originalMemberId: request.targetMemberId,
          },
        });

        await tx.dutyChangeRequest.update({
          where: { id },
          data: { status: "APPROVED" },
        });
      });

      const requesterDate = format(request.requesterAssignment.date, "M월 d일 (eee)", { locale: ko });
      const targetDate = format(request.targetAssignment.date, "M월 d일 (eee)", { locale: ko });

      await Promise.all([
        sendNotification(request.requesterId, NotificationType.REQUEST_APPROVED, {
          title: "당직 변경 요청이 승인되었습니다",
          body: `${requesterDate}과 ${targetDate} 당직이 교환되었습니다.`,
        }),
        sendNotification(session.memberId, NotificationType.SWAP_COMPLETED, {
          title: "당직 교환 완료",
          body: `${request.requester.rank} ${request.requester.name}님과 당직 교환이 완료되었습니다.`,
        }),
      ]);

      return NextResponse.json({ message: "승인되었습니다." });
    }

    if (action === "reject") {
      await prisma.dutyChangeRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      await sendNotification(request.requesterId, NotificationType.REQUEST_REJECTED, {
        title: "당직 변경 요청이 거절되었습니다",
        body: "죄송하지만 제가 그때 일정이 있어 변경이 어려울 것 같습니다.",
      });

      return NextResponse.json({ message: "거절되었습니다." });
    }

    return NextResponse.json({ error: "유효하지 않은 액션입니다." }, { status: 400 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
