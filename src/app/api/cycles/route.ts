import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    const cycles = await prisma.dutyCycle.findMany({
      where: { unitId: session.unitId },
      include: {
        cycleMembers: {
          include: { member: { select: { id: true, name: true, rank: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cycles);
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { name, startDate, endDate, memberIds, weekdayStartOffset, weekendAStartOffset, weekendBStartOffset } = await req.json();

    if (!name || !startDate || !endDate || !Array.isArray(memberIds)) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const cycle = await prisma.dutyCycle.create({
      data: {
        unitId: session.unitId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        weekdayStartOffset: weekdayStartOffset ?? 0,
        weekendAStartOffset: weekendAStartOffset ?? 0,
        weekendBStartOffset: weekendBStartOffset ?? 0,
        cycleMembers: {
          create: memberIds.map((memberId: string, index: number) => ({
            memberId,
            sortOrder: index,
          })),
        },
      },
      include: { cycleMembers: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
