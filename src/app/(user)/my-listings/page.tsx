"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DutyType } from "@prisma/client";

interface Offer {
  id: string;
  status: string;
  offerer: { id: string; name: string; rank: string };
  offererAssignmentId: string;
}

interface Listing {
  id: string;
  message: string | null;
  status: string;
  poster: { id: string };
  assignment: { date: string; dutyType: DutyType };
  _count: { offers: number };
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/listings").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([listingsData, meData]) => {
      setMe(meData);
      const mine = listingsData.filter((l: Listing) => l.poster.id === meData.id);
      setListings(mine);
      setLoading(false);
    });
  }, []);

  async function loadOffers(listingId: string) {
    setSelectedListingId(listingId);
    const res = await fetch(`/api/listings/${listingId}/offers`);
    const data = await res.json();
    setOffers(data);
  }

  async function handleAction(listingId: string, offerId: string, action: "approve" | "reject") {
    const res = await fetch(`/api/listings/${listingId}/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      alert(action === "approve" ? "승인되었습니다." : "거절되었습니다.");
      window.location.reload();
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">내 변경 희망 게시글</h1>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          등록한 게시글이 없습니다.
        </div>
      ) : (
        listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DutyTypeBadge type={listing.assignment.dutyType} />
                <span className="text-sm font-medium text-gray-800">
                  {format(new Date(listing.assignment.date), "M월 d일 (eee)", { locale: ko })}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  listing.status === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {listing.status === "OPEN" ? "모집 중" : "마감"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadOffers(listing.id)}
            >
              신청 {listing._count.offers}건 보기
            </Button>

            {selectedListingId === listing.id && (
              <div className="space-y-2 mt-2">
                {offers.length === 0 ? (
                  <p className="text-sm text-gray-400">신청이 없습니다.</p>
                ) : (
                  offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">
                        {offer.offerer.rank} {offer.offerer.name}
                      </span>
                      {offer.status === "PENDING" && listing.status === "OPEN" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(listing.id, offer.id, "approve")}
                          >
                            승인
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(listing.id, offer.id, "reject")}
                          >
                            거절
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {offer.status === "APPROVED" ? "승인됨" : "거절됨"}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
