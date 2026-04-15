import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const session = await requireSession(req);
    const { id: listingId, offerId } = await params;
    const { action } = await req.json(); // "approve" | "reject"

    const offer = await prisma.dutyChangeOffer.findUnique({
      where: { id: offerId },
      include: {
        listing: {
          include: {
            assignment: true,
            poster: { select: { id: true, name: true, rank: true } },
          },
        },
        offerer: { select: { id: true, name: true, rank: true } },
      },
    });

    if (!offer || offer.listingId !== listingId) {
      return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
    }

    if (offer.listing.posterId !== session.memberId) {
      return NextResponse.json({ error: "게시글 작성자만 처리할 수 있습니다." }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 신청입니다." }, { status: 409 });
    }

    if (action === "approve") {
      const offererAssignment = await prisma.dutyAssignment.findUnique({
        where: { id: offer.offererAssignmentId },
      });

      if (!offererAssignment) {
        return NextResponse.json({ error: "제안 근무를 찾을 수 없습니다." }, { status: 404 });
      }

      const listingAssignment = offer.listing.assignment;

      await prisma.$transaction(async (tx) => {
        // Swap members
        await tx.dutyAssignment.update({
          where: { id: listingAssignment.id },
          data: {
            memberId: offererAssignment.memberId,
            isSwapped: true,
            originalMemberId: listingAssignment.memberId,
          },
        });

        await tx.dutyAssignment.update({
          where: { id: offererAssignment.id },
          data: {
            memberId: listingAssignment.memberId,
            isSwapped: true,
            originalMemberId: offererAssignment.memberId,
          },
        });

        // Close listing
        await tx.dutyChangeListing.update({
          where: { id: listingId },
          data: { status: "CLOSED" },
        });

        // Approve this offer
        await tx.dutyChangeOffer.update({
          where: { id: offerId },
          data: { status: "APPROVED" },
        });

        // Reject all other pending offers
        await tx.dutyChangeOffer.updateMany({
          where: { listingId, id: { not: offerId }, status: "PENDING" },
          data: { status: "REJECTED" },
        });
      });

      const listingDate = format(listingAssignment.date, "M월 d일 (eee)", { locale: ko });
      const offerDate = format(offererAssignment.date, "M월 d일 (eee)", { locale: ko });

      await Promise.all([
        sendNotification(offer.offererId, NotificationType.LISTING_OFFER_APPROVED, {
          title: "당직 변경이 승인되었습니다",
          body: `${listingDate}과 ${offerDate} 당직이 교환되었습니다.`,
        }),
        sendNotification(session.memberId, NotificationType.SWAP_COMPLETED, {
          title: "당직 교환 완료",
          body: `${offer.offerer.rank} ${offer.offerer.name}님과 당직 교환이 완료되었습니다.`,
        }),
      ]);

      return NextResponse.json({ message: "승인되었습니다." });
    }

    if (action === "reject") {
      await prisma.dutyChangeOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" },
      });

      await sendNotification(offer.offererId, NotificationType.LISTING_OFFER_REJECTED, {
        title: "당직 변경 신청이 거절되었습니다",
        body: "죄송하지만 제가 그때 일정이 있어 변경이 어려울 것 같습니다.",
      });

      return NextResponse.json({ message: "거절되었습니다." });
    }

    return NextResponse.json({ error: "유효하지 않은 액션입니다." }, { status: 400 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
