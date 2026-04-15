import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { militaryId, password, name, rank, unitCode } = await req.json();

    if (!militaryId || !password || !name || !rank || !unitCode) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findUnique({ where: { code: unitCode } });
    if (!unit) {
      return NextResponse.json(
        { error: "유효하지 않은 부대코드입니다." },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findUnique({ where: { militaryId } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 군번입니다." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const member = await prisma.member.create({
      data: {
        militaryId,
        passwordHash,
        name,
        rank,
        unitId: unit.id,
      },
    });

    return NextResponse.json(
      { message: "회원가입이 완료되었습니다.", memberId: member.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
