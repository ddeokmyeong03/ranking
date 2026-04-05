import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { unitCode, nickname, password } = await req.json();

    const unit = await prisma.unit.findUnique({ where: { code: unitCode?.toUpperCase() } });
    if (!unit) {
      return NextResponse.json({ error: "존재하지 않는 부대 코드입니다" }, { status: 404 });
    }

    const member = await prisma.member.findUnique({
      where: { unitId_nickname: { unitId: unit.id, nickname } },
    });
    if (!member) {
      return NextResponse.json({ error: "닉네임 또는 비밀번호가 틀렸습니다" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, member.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "닉네임 또는 비밀번호가 틀렸습니다" }, { status: 401 });
    }

    const token = await signToken({
      memberId: member.id,
      unitId: unit.id,
      nickname: member.nickname,
      unitCode: unit.code,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      memberId: member.id,
      nickname: member.nickname,
      unitCode: unit.code,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
