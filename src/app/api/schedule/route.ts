import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);

    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);

    const [assignments, holidays] = await Promise.all([
      prisma.dutyAssignment.findMany({
        where: {
          unitId: session.unitId,
          date: { gte: start, lte: end },
        },
        include: {
          member: { select: { id: true, name: true, rank: true } },
        },
        orderBy: [{ date: "asc" }, { dutyType: "asc" }],
      }),
      prisma.unitHoliday.findMany({
        where: {
          unitId: session.unitId,
          date: { gte: start, lte: end },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({ assignments, holidays, year, month });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
