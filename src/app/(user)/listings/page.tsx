"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { DutyType } from "@prisma/client";

interface Listing {
  id: string;
  message: string | null;
  status: string;
  poster: { id: string; name: string; rank: string };
  assignment: { date: string; dutyType: DutyType };
  _count: { offers: number };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">변경 희망 게시글</h1>
        <Link href="/my-listings">
          <Button variant="secondary" size="sm">내 게시글</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">로딩 중...</p>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          등록된 변경 희망 게시글이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DutyTypeBadge type={listing.assignment.dutyType} />
                      <span className="text-sm font-medium text-gray-800">
                        {format(new Date(listing.assignment.date), "M월 d일 (eee)", { locale: ko })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {listing.poster.rank} {listing.poster.name}
                    </p>
                    {listing.message && (
                      <p className="text-xs text-gray-400">{listing.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">신청 {listing._count.offers}명</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
