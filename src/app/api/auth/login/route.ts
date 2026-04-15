import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createTempSession, setTempSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { militaryId, password } = await req.json();

    if (!militaryId || !password) {
      return NextResponse.json(
        { error: "군번과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({ where: { militaryId } });
    if (!member || !member.isActive) {
      return NextResponse.json(
        { error: "군번 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "군번 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const tempToken = await createTempSession({
      memberId: member.id,
      militaryId: member.militaryId,
    });

    const res = NextResponse.json({ message: "1단계 인증 완료" });
    await setTempSessionCookie(tempToken);

    return res;
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
