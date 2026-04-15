import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { broadcastToUnit } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);

    const listings = await prisma.dutyChangeListing.findMany({
      where: {
        assignment: { unitId: session.unitId },
        status: "OPEN",
      },
      include: {
        poster: { select: { id: true, name: true, rank: true } },
        assignment: {
          select: { date: true, dutyType: true },
        },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { assignmentId, message } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: "편성 ID가 필요합니다." }, { status: 400 });
    }

    // Verify the assignment belongs to the current member
    const assignment = await prisma.dutyAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.memberId !== session.memberId) {
      return NextResponse.json({ error: "본인의 근무만 등록할 수 있습니다." }, { status: 403 });
    }

    // Check no existing open listing for this assignment
    const existingListing = await prisma.dutyChangeListing.findFirst({
      where: { assignmentId, status: "OPEN" },
    });
    if (existingListing) {
      return NextResponse.json(
        { error: "해당 근무에 이미 등록된 변경 희망이 있습니다." },
        { status: 409 }
      );
    }

    const listing = await prisma.dutyChangeListing.create({
      data: {
        assignmentId,
        posterId: session.memberId,
        message,
      },
      include: {
        assignment: { select: { date: true, dutyType: true } },
        poster: { select: { name: true, rank: true } },
      },
    });

    const dateStr = format(listing.assignment.date, "M월 d일 (eee)", { locale: ko });
    await broadcastToUnit(
      session.unitId,
      NotificationType.LISTING_NEW,
      {
        title: "당직 변경 희망 등록",
        body: `${listing.poster.rank} ${listing.poster.name}님이 ${dateStr} 근무 변경을 희망합니다.`,
        data: { listingId: listing.id },
      },
      session.memberId
    );

    return NextResponse.json(listing, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
