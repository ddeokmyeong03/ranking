import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: { unit: { select: { id: true, name: true, code: true } } },
  });

  if (!member) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({
    id: member.id,
    militaryId: member.militaryId,
    name: member.name,
    rank: member.rank,
    position: member.position,
    commissionDate: member.commissionDate,
    dischargeDate: member.dischargeDate,
    role: member.role,
    unit: member.unit,
  });
}
