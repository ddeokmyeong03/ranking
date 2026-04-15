import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTempSession,
  createSession,
  setSessionCookie,
} from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const tempSession = await getTempSession(req);
    if (!tempSession) {
      return NextResponse.json(
        { error: "세션이 만료되었습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }

    const { unitCode } = await req.json();
    if (!unitCode) {
      return NextResponse.json(
        { error: "부대코드를 입력해주세요." },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: tempSession.memberId },
      include: { unit: true },
    });

    if (!member || member.unit.code !== unitCode) {
      return NextResponse.json(
        { error: "부대코드가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const token = await createSession({
      memberId: member.id,
      unitId: member.unitId,
      unitCode: member.unit.code,
      role: member.role,
    });

    await setSessionCookie(token);
    // Clear temp session
    const cookieStore = await cookies();
    cookieStore.delete("temp_session");

    return NextResponse.json({
      message: "로그인 성공",
      member: {
        id: member.id,
        name: member.name,
        rank: member.rank,
        role: member.role,
        unitName: member.unit.name,
      },
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
