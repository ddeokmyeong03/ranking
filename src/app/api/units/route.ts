import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUnitCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "부대명을 입력해주세요" }, { status: 400 });
    }

    let code = generateUnitCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.unit.findUnique({ where: { code } });
      if (!existing) break;
      code = generateUnitCode();
      attempts++;
    }

    const unit = await prisma.unit.create({
      data: { code, name: name.trim() },
    });

    return NextResponse.json({ code: unit.code, name: unit.name, id: unit.id });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
