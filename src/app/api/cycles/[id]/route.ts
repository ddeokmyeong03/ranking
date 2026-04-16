import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET: 단일 사이클 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id: cycleId } = await params;

    const cycle = await prisma.dutyCycle.findUnique({
      where: { id: cycleId },
      include: {
        cycleMembers: {
          include: {
            member: { select: { id: true, name: true, rank: true, isActive: true, transferOrderDate: true, dischargeDate: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!cycle || cycle.unitId !== session.unitId) {
      return NextResponse.json({ error: "사이클을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(cycle);
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH: 사이클 수정 (기본 정보 + 멤버 목록 + 오프셋)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id: cycleId } = await params;
    const body = await req.json();

    const cycle = await prisma.dutyCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.unitId !== session.unitId) {
      return NextResponse.json({ error: "사이클을 찾을 수 없습니다." }, { status: 404 });
    }

    const {
      name,
      startDate,
      endDate,
      memberIds,          // 순서 포함 배열 (순서 = 인덱스)
      excludedMemberIds,  // 제외 멤버 id 배열
      weekdayStartOffset,
      weekendAStartOffset,
      weekendBStartOffset,
    } = body;

    // 기본 정보 업데이트
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (weekdayStartOffset !== undefined) updateData.weekdayStartOffset = weekdayStartOffset;
    if (weekendAStartOffset !== undefined) updateData.weekendAStartOffset = weekendAStartOffset;
    if (weekendBStartOffset !== undefined) updateData.weekendBStartOffset = weekendBStartOffset;

    await prisma.$transaction(async (tx) => {
      // 기본 정보 업데이트
      if (Object.keys(updateData).length > 0) {
        await tx.dutyCycle.update({ where: { id: cycleId }, data: updateData });
      }

      // 멤버 목록 업데이트
      if (Array.isArray(memberIds)) {
        const excluded = new Set<string>(Array.isArray(excludedMemberIds) ? excludedMemberIds : []);

        await tx.dutyCycleMember.deleteMany({ where: { cycleId } });
        await tx.dutyCycleMember.createMany({
          data: memberIds.map((memberId: string, index: number) => ({
            cycleId,
            memberId,
            sortOrder: index,
            isExcluded: excluded.has(memberId),
          })),
        });
      } else if (Array.isArray(excludedMemberIds)) {
        // 멤버 목록은 변경 없이 제외 여부만 업데이트
        const excluded = new Set<string>(excludedMemberIds);
        const existingMembers = await tx.dutyCycleMember.findMany({ where: { cycleId } });
        for (const cm of existingMembers) {
          await tx.dutyCycleMember.update({
            where: { id: cm.id },
            data: { isExcluded: excluded.has(cm.memberId) },
          });
        }
      }
    });

    const updated = await prisma.dutyCycle.findUnique({
      where: { id: cycleId },
      include: {
        cycleMembers: {
          include: { member: { select: { id: true, name: true, rank: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE: 사이클 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id: cycleId } = await params;

    const cycle = await prisma.dutyCycle.findUnique({ where: { id: cycleId } });
    if (!cycle || cycle.unitId !== session.unitId) {
      return NextResponse.json({ error: "사이클을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.dutyCycle.delete({ where: { id: cycleId } });
    return NextResponse.json({ message: "사이클이 삭제되었습니다." });
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === "Unauthorized" || e.message === "Forbidden")) {
      return NextResponse.json({ error: e.message }, { status: e.message === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
