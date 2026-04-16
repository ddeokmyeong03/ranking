import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id: listingId } = await params;

    const listing = await prisma.dutyChangeListing.findUnique({
      where: { id: listingId },
      include: { assignment: { select: { unitId: true } } },
    });

    if (!listing || listing.assignment.unitId !== session.unitId) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    const offers = await prisma.dutyChangeOffer.findMany({
      where: { listingId },
      include: {
        offerer: { select: { id: true, name: true, rank: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch offerer assignment dates to display in UI
    const assignmentIds = offers.map((o) => o.offererAssignmentId);
    const assignments = await prisma.dutyAssignment.findMany({
      where: { id: { in: assignmentIds } },
      select: { id: true, date: true, dutyType: true },
    });
    const assignmentMap = Object.fromEntries(assignments.map((a) => [a.id, a]));

    const offersWithAssignment = offers.map((o) => ({
      ...o,
      offererAssignment: assignmentMap[o.offererAssignmentId] ?? null,
    }));

    return NextResponse.json(offersWithAssignment);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id: listingId } = await params;
    const { offererAssignmentId } = await req.json();

    if (!offererAssignmentId) {
      return NextResponse.json({ error: "신청할 근무를 선택해주세요." }, { status: 400 });
    }

    const [listing, offererAssignment] = await Promise.all([
      prisma.dutyChangeListing.findUnique({
        where: { id: listingId },
        include: {
          assignment: { select: { unitId: true, date: true, dutyType: true } },
          poster: { select: { id: true, name: true, rank: true } },
        },
      }),
      prisma.dutyAssignment.findUnique({ where: { id: offererAssignmentId } }),
    ]);

    if (!listing || listing.assignment.unitId !== session.unitId) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (listing.status !== "OPEN") {
      return NextResponse.json({ error: "이미 마감된 게시글입니다." }, { status: 409 });
    }

    if (listing.posterId === session.memberId) {
      return NextResponse.json({ error: "본인의 게시글에는 신청할 수 없습니다." }, { status: 400 });
    }

    if (!offererAssignment || offererAssignment.memberId !== session.memberId) {
      return NextResponse.json({ error: "본인의 근무만 제안할 수 있습니다." }, { status: 403 });
    }

    // Check no duplicate offer
    const existingOffer = await prisma.dutyChangeOffer.findFirst({
      where: { listingId, offererId: session.memberId, status: "PENDING" },
    });
    if (existingOffer) {
      return NextResponse.json({ error: "이미 신청한 게시글입니다." }, { status: 409 });
    }

    // 게시글 작성자(poster)가 제안자의 근무일에 휴가인지 확인
    const posterLeave = await prisma.memberLeave.findFirst({
      where: {
        memberId: listing.posterId,
        startDate: { lte: offererAssignment.date },
        endDate: { gte: offererAssignment.date },
      },
    });
    if (posterLeave) {
      const leaveLabel = posterLeave.leaveType === "VACATION" ? "휴가" : "휴무";
      return NextResponse.json(
        { error: `게시글 작성자가 해당 날짜에 ${leaveLabel} 중이므로 교환할 수 없습니다.`, blockedByLeave: true },
        { status: 409 }
      );
    }

    // 신청자(offerer)가 게시글 근무일에 휴가인지 확인
    const offererLeave = await prisma.memberLeave.findFirst({
      where: {
        memberId: session.memberId,
        startDate: { lte: listing.assignment.date },
        endDate: { gte: listing.assignment.date },
      },
    });
    if (offererLeave) {
      const leaveLabel = offererLeave.leaveType === "VACATION" ? "휴가" : "휴무";
      return NextResponse.json(
        { error: `본인이 해당 날짜에 ${leaveLabel} 중이므로 교환할 수 없습니다.`, blockedByLeave: true },
        { status: 409 }
      );
    }

    const offer = await prisma.dutyChangeOffer.create({
      data: {
        listingId,
        offererId: session.memberId,
        offererAssignmentId,
      },
      include: {
        offerer: { select: { name: true, rank: true } },
      },
    });

    const offererAssignmentData = await prisma.dutyAssignment.findUnique({
      where: { id: offererAssignmentId },
    });

    const listingDateStr = format(listing.assignment.date, "M월 d일 (eee)", { locale: ko });
    const offerDateStr = offererAssignmentData
      ? format(offererAssignmentData.date, "M월 d일 (eee)", { locale: ko })
      : "";

    await sendNotification(listing.posterId, NotificationType.LISTING_OFFER_RECEIVED, {
      title: "당직 변경 신청이 들어왔습니다",
      body: `${offer.offerer.rank} ${offer.offerer.name}님이 ${listingDateStr} 근무 변경을 신청했습니다. (제안 날짜: ${offerDateStr})`,
      data: { listingId, offerId: offer.id },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
