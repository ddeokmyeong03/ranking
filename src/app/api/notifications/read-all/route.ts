import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession(req);

    await prisma.notification.updateMany({
      where: { recipientId: session.memberId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "모두 읽음 처리되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
