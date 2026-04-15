import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;

    const listing = await prisma.dutyChangeListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (listing.posterId !== session.memberId) {
      return NextResponse.json({ error: "본인의 게시글만 삭제할 수 있습니다." }, { status: 403 });
    }

    if (listing.status !== "OPEN") {
      return NextResponse.json({ error: "이미 처리된 게시글은 삭제할 수 없습니다." }, { status: 409 });
    }

    await prisma.dutyChangeListing.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ message: "게시글이 취소되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
