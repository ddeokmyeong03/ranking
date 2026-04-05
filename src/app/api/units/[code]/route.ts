import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { code: params.code.toUpperCase() },
      include: { _count: { select: { members: true } } },
    });

    if (!unit) {
      return NextResponse.json({ error: "존재하지 않는 부대 코드입니다" }, { status: 404 });
    }

    return NextResponse.json({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      memberCount: unit._count.members,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
