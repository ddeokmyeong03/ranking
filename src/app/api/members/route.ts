import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    const members = await prisma.member.findMany({
      where: { unitId: session.unitId },
      select: {
        id: true,
        militaryId: true,
        name: true,
        rank: true,
        position: true,
        role: true,
        isActive: true,
        commissionDate: true,
        dischargeDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
