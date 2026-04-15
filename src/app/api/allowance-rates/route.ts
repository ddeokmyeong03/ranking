import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);

    const rates = await prisma.allowanceRate.findMany({
      where: { unitId: session.unitId },
      orderBy: [{ dutyType: "asc" }, { effectiveFrom: "desc" }],
    });

    return NextResponse.json(rates);
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
    const { dutyType, amountKRW, effectiveFrom, effectiveTo } = await req.json();

    if (!dutyType || amountKRW === undefined || !effectiveFrom) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const rate = await prisma.allowanceRate.create({
      data: {
        unitId: session.unitId,
        dutyType,
        amountKRW,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
