"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DutyType } from "@prisma/client";

interface Listing {
  id: string;
  message: string | null;
  status: string;
  poster: { id: string; name: string; rank: string };
  assignment: { date: string; dutyType: DutyType; id: string };
}

interface MyAssignment {
  id: string;
  date: string;
  dutyType: DutyType;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [myAssignments, setMyAssignments] = useState<MyAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    Promise.all([
      fetch(`/api/schedule?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
      fetch("/api/auth/me"),
    ])
      .then(async ([scheduleRes, meRes]) => {
        const scheduleData = await scheduleRes.json();
        const meData = await meRes.json();
        setMe(meData);
        const myA = (scheduleData.assignments ?? []).filter(
          (a: MyAssignment & { memberId: string }) => a.memberId === meData.id
        );
        setMyAssignments(myA);
      });

    // Fetch listing details from listings list
    fetch("/api/listings")
      .then((r) => r.json())
      .then((listings) => {
        const found = listings.find((l: Listing) => l.id === id);
        setListing(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleOffer() {
    if (!selectedAssignmentId) {
      setError("제안할 근무를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offererAssignmentId: selectedAssignmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "신청에 실패했습니다.");
        return;
      }
      alert("신청이 완료되었습니다. 게시자의 승인을 기다려주세요.");
      router.push("/listings");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;
  if (!listing) return <p className="text-center text-gray-400 py-8">게시글을 찾을 수 없습니다.</p>;

  const isMyListing = me?.id === listing.poster.id;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        ← 목록으로
      </button>

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <DutyTypeBadge type={listing.assignment.dutyType} />
          <span className="font-semibold text-gray-900">
            {format(new Date(listing.assignment.date), "yyyy년 M월 d일 (eee)", { locale: ko })}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {listing.poster.rank} {listing.poster.name}님의 근무
        </p>
        {listing.message && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{listing.message}</p>
        )}
      </div>

      {!isMyListing && listing.status === "OPEN" && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">변경 신청하기</h2>
          <p className="text-sm text-gray-500">
            내 근무 중 교환을 제안할 날짜를 선택해주세요.
          </p>

          {myAssignments.length === 0 ? (
            <p className="text-sm text-gray-400">이번 달 편성된 근무가 없습니다.</p>
          ) : (
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">근무를 선택하세요</option>
              {myAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {format(new Date(a.date), "M월 d일 (eee)", { locale: ko })} —{" "}
                  {a.dutyType === "WEEKDAY" ? "평일" : a.dutyType === "WEEKEND_DAY" ? "주말 주간" : "주말 야간"}
                </option>
              ))}
            </select>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleOffer} disabled={submitting} className="w-full">
            {submitting ? "신청 중..." : "변경 신청"}
          </Button>
        </div>
      )}

      {isMyListing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          본인의 게시글입니다. 신청 목록은{" "}
          <a href="/my-listings" className="underline font-medium">
            내 게시글
          </a>
          에서 확인하세요.
        </div>
      )}
    </div>
  );
}
