import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const holiday = await prisma.unitHoliday.findUnique({ where: { id } });
    if (!holiday || holiday.unitId !== session.unitId) {
      return NextResponse.json({ error: "휴일을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.unitHoliday.delete({ where: { id } });
    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
