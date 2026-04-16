import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateSchedule } from "@/lib/scheduler";
import { broadcastToUnit } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id: cycleId } = await params;

    const cycle = await prisma.dutyCycle.findUnique({
      where: { id: cycleId },
      include: {
        cycleMembers: {
          where: { isExcluded: false },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!cycle || cycle.unitId !== session.unitId) {
      return NextResponse.json({ error: "사이클을 찾을 수 없습니다." }, { status: 404 });
    }

    const holidays = await prisma.unitHoliday.findMany({
      where: {
        unitId: session.unitId,
        date: { gte: cycle.startDate, lte: cycle.endDate },
      },
    });

    const assignments = generateSchedule({
      cycleId,
      unitId: session.unitId,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      cycleMembers: cycle.cycleMembers.map((cm) => ({
        memberId: cm.memberId,
        sortOrder: cm.sortOrder,
      })),
      holidays: holidays.map((h) => ({ date: h.date, type: h.type })),
      weekdayStartOffset: cycle.weekdayStartOffset,
      weekendAStartOffset: cycle.weekendAStartOffset,
      weekendBStartOffset: cycle.weekendBStartOffset,
    });

    // Delete existing non-swapped assignments for this cycle period
    // 먼저 삭제 대상 assignment ID 목록 조회
    await prisma.$transaction(async (tx) => {
      const toDelete = await tx.dutyAssignment.findMany({
        where: {
          unitId: session.unitId,
          cycleId,
          isSwapped: false,
          date: { gte: cycle.startDate, lte: cycle.endDate },
        },
        select: { id: true },
      });
      const toDeleteIds = toDelete.map((a) => a.id);

      if (toDeleteIds.length > 0) {
        // 해당 assignment를 참조하는 게시글(listing) ID 수집
        const listings = await tx.dutyChangeListing.findMany({
          where: { assignmentId: { in: toDeleteIds } },
          select: { id: true },
        });
        const listingIds = listings.map((l) => l.id);

        // 신청(offer) 삭제 → 게시글(listing) 삭제
        if (listingIds.length > 0) {
          await tx.dutyChangeOffer.deleteMany({ where: { listingId: { in: listingIds } } });
          await tx.dutyChangeListing.deleteMany({ where: { id: { in: listingIds } } });
        }

        // 직접 변경 요청(request) 삭제
        await tx.dutyChangeRequest.deleteMany({
          where: {
            OR: [
              { requesterAssignmentId: { in: toDeleteIds } },
              { targetAssignmentId: { in: toDeleteIds } },
            ],
          },
        });

        // 이제 assignment 삭제 가능
        await tx.dutyAssignment.deleteMany({ where: { id: { in: toDeleteIds } } });
      }

      await tx.dutyAssignment.createMany({
        data: assignments,
        skipDuplicates: true,
      });
    });

    await broadcastToUnit(session.unitId, NotificationType.DUTY_SCHEDULE_PUBLISHED, {
      title: "근무표가 발행되었습니다",
      body: `${cycle.name} 당직근무표가 편성되었습니다. 확인해주세요.`,
      data: { cycleId },
    });

    return NextResponse.json({
      message: "편성이 완료되었습니다.",
      count: assignments.length,
    });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
