import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id } = await params;
    const body = await req.json();

    // Self-edit: position, commissionDate, dischargeDate, password
    if (id === session.memberId) {
      const { position, commissionDate, dischargeDate, password } = body;
      const updateData: Record<string, unknown> = {};
      if (position !== undefined) updateData.position = position;
      if (commissionDate !== undefined)
        updateData.commissionDate = commissionDate ? new Date(commissionDate) : null;
      if (dischargeDate !== undefined)
        updateData.dischargeDate = dischargeDate ? new Date(dischargeDate) : null;
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      const updated = await prisma.member.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ message: "프로필이 수정되었습니다.", id: updated.id });
    }

    // Admin-only: role, isActive
    if (session.role !== "UNIT_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role, isActive } = body;
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.member.update({ where: { id }, data: updateData });
    return NextResponse.json({ message: "수정되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
