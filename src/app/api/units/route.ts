import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUnitCode } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/session";

// POST: Create a new unit + admin account (bootstrap flow)
export async function POST(req: NextRequest) {
  try {
    const { unitName, adminMilitaryId, adminPassword, adminName, adminRank } =
      await req.json();

    if (!unitName || !adminMilitaryId || !adminPassword || !adminName || !adminRank) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findUnique({
      where: { militaryId: adminMilitaryId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 군번입니다." },
        { status: 409 }
      );
    }

    const unitCode = generateUnitCode();
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const unit = await prisma.unit.create({
      data: {
        name: unitName,
        code: unitCode,
        members: {
          create: {
            militaryId: adminMilitaryId,
            passwordHash,
            name: adminName,
            rank: adminRank,
            role: "UNIT_ADMIN",
          },
        },
      },
      include: { members: true },
    });

    const admin = unit.members[0];
    const token = await createSession({
      memberId: admin.id,
      unitId: unit.id,
      unitCode: unit.code,
      role: "UNIT_ADMIN",
    });

    await setSessionCookie(token);

    return NextResponse.json(
      { unitCode, unitName: unit.name, message: "부대가 생성되었습니다." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
