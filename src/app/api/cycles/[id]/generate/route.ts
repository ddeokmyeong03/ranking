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
    });

    // Delete existing non-swapped assignments for this cycle period
    await prisma.$transaction(async (tx) => {
      await tx.dutyAssignment.deleteMany({
        where: {
          unitId: session.unitId,
          cycleId,
          isSwapped: false,
          date: { gte: cycle.startDate, lte: cycle.endDate },
        },
      });

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
