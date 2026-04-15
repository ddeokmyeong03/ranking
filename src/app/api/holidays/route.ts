import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";
import { generateSlotsForDay } from "@/lib/scheduler";
import { sendNotification } from "@/lib/notifications";
import { DutyType, NotificationType } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);

    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);

    const holidays = await prisma.unitHoliday.findMany({
      where: {
        unitId: session.unitId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { date, type, name } = await req.json();

    if (!date || !type) {
      return NextResponse.json({ error: "날짜와 유형을 입력해주세요." }, { status: 400 });
    }

    const holidayDate = new Date(date);

    // Check if holiday already exists
    const existing = await prisma.unitHoliday.findUnique({
      where: { unitId_date: { unitId: session.unitId, date: holidayDate } },
    });
    if (existing) {
      return NextResponse.json({ error: "해당 날짜에 이미 등록된 휴일이 있습니다." }, { status: 409 });
    }

    const holiday = await prisma.unitHoliday.create({
      data: {
        unitId: session.unitId,
        date: holidayDate,
        type,
        name,
        createdById: session.memberId,
      },
    });

    // If COMBAT_REST: cascade existing weekday assignment → weekend slots
    if (type === "COMBAT_REST") {
      const existingWeekday = await prisma.dutyAssignment.findUnique({
        where: {
          unitId_date_dutyType: {
            unitId: session.unitId,
            date: holidayDate,
            dutyType: DutyType.WEEKDAY,
          },
        },
        include: { member: true },
      });

      if (existingWeekday) {
        // Notify the removed weekday member
        await sendNotification(
          existingWeekday.memberId,
          NotificationType.DUTY_SCHEDULE_PUBLISHED,
          {
            title: "당직 편성 변경",
            body: `${new Date(date).toLocaleDateString("ko-KR")} 전투휴무 지정으로 인해 당직 편성이 변경되었습니다.`,
          }
        );

        // Get active cycle for the unit
        const activeCycle = await prisma.dutyCycle.findFirst({
          where: {
            unitId: session.unitId,
            isActive: true,
            startDate: { lte: holidayDate },
            endDate: { gte: holidayDate },
          },
          include: {
            cycleMembers: {
              where: { isExcluded: false },
              orderBy: { sortOrder: "asc" },
            },
          },
        });

        // Get existing duty counts for fair assignment
        const counts: Record<string, Record<DutyType, number>> = {};
        if (activeCycle) {
          const existingAssignments = await prisma.dutyAssignment.findMany({
            where: {
              unitId: session.unitId,
              cycleId: activeCycle.id,
              date: {
                gte: activeCycle.startDate,
                lt: holidayDate,
              },
            },
          });

          for (const a of existingAssignments) {
            if (!counts[a.memberId]) {
              counts[a.memberId] = {
                WEEKDAY: 0,
                WEEKEND_DAY: 0,
                WEEKEND_NIGHT: 0,
              };
            }
            counts[a.memberId][a.dutyType]++;
          }

          const newSlots = generateSlotsForDay(
            holidayDate,
            session.unitId,
            activeCycle.id,
            activeCycle.cycleMembers.map((cm) => ({
              memberId: cm.memberId,
              sortOrder: cm.sortOrder,
            })),
            counts
          );

          await prisma.$transaction(async (tx) => {
            // Remove existing weekday assignment
            await tx.dutyAssignment.delete({ where: { id: existingWeekday.id } });

            // Create weekend slots
            for (const slot of newSlots) {
              await tx.dutyAssignment.upsert({
                where: {
                  unitId_date_dutyType: {
                    unitId: slot.unitId,
                    date: slot.date,
                    dutyType: slot.dutyType,
                  },
                },
                create: slot,
                update: { memberId: slot.memberId },
              });

              // Notify newly assigned members
              await sendNotification(
                slot.memberId,
                NotificationType.DUTY_SCHEDULE_PUBLISHED,
                {
                  title: "새 당직 편성",
                  body: `${new Date(date).toLocaleDateString("ko-KR")} 전투휴무에 당직이 편성되었습니다.`,
                }
              );
            }
          });
        }
      }
    }

    return NextResponse.json(holiday, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
