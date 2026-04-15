import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// PUT: Reorder cycle members
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id: cycleId } = await params;
    const { memberIds } = await req.json(); // ordered array of memberIds

    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: "memberIds 배열이 필요합니다." }, { status: 400 });
    }

    const cycle = await prisma.dutyCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.unitId !== session.unitId) {
      return NextResponse.json({ error: "사이클을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.dutyCycleMember.deleteMany({ where: { cycleId } }),
      prisma.dutyCycleMember.createMany({
        data: memberIds.map((memberId: string, index: number) => ({
          cycleId,
          memberId,
          sortOrder: index,
        })),
      }),
    ]);

    return NextResponse.json({ message: "편성 순서가 업데이트되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
