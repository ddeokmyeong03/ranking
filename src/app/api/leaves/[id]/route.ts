import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

// DELETE: 휴가/휴무 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;

    const leave = await prisma.memberLeave.findUnique({
      where: { id },
      include: { member: { select: { unitId: true } } },
    });

    if (!leave) {
      return NextResponse.json({ error: "휴가 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 자신의 것 또는 관리자만 삭제 가능
    const isOwner = leave.memberId === session.memberId;
    const isAdmin = session.role === "UNIT_ADMIN" && leave.member.unitId === session.unitId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }

    await prisma.memberLeave.delete({ where: { id } });
    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
