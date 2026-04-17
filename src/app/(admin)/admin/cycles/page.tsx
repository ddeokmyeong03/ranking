"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AdminBackButton } from "@/components/Admin/AdminBackButton";

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  weekdayStartOffset: number;
  weekendAStartOffset: number;
  weekendBStartOffset: number;
  cycleMembers: {
    member: { id: string; name: string; rank: string };
    sortOrder: number;
    isExcluded: boolean;
  }[];
}

function isCurrentlyActive(cycle: Cycle): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(cycle.startDate);
  const end = new Date(cycle.endDate);
  return start <= today && today <= end;
}

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then(setCycles)
      .finally(() => setLoading(false));
  }, []);

  async function generateSchedule(cycleId: string) {
    const res = await fetch(`/api/cycles/${cycleId}/generate`, { method: "POST" });
    const data = await res.json();
    if (res.ok) alert(`편성 완료: ${data.count}개 배정`);
    else alert(data.error ?? "편성 실패");
  }

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;

  return (
    <div className="space-y-5">
      <AdminBackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">사이클 관리</h1>
        <Link href="/admin/cycles/new">
          <Button>새 사이클 생성</Button>
        </Link>
      </div>

      {cycles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          등록된 사이클이 없습니다.
          <br />
          <Link href="/admin/cycles/new" className="text-green-700 underline mt-2 inline-block">
            첫 사이클 생성하기
          </Link>
        </div>
      ) : (
        cycles.map((cycle) => (
          <div key={cycle.id} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{cycle.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(cycle.startDate), "yyyy.MM.dd", { locale: ko })} —{" "}
                  {format(new Date(cycle.endDate), "yyyy.MM.dd", { locale: ko })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button size="sm" onClick={() => generateSchedule(cycle.id)}>
                  편성 실행
                </Button>
                <Link href={`/admin/cycles/${cycle.id}/edit`}>
                  <Button variant="secondary" size="sm">수정</Button>
                </Link>
                <Link href={`/admin/schedule?cycleId=${cycle.id}`}>
                  <Button variant="secondary" size="sm">근무표 보기</Button>
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">
                편성 순서 ({cycle.cycleMembers.filter((cm) => !cm.isExcluded).length}명 활성
                {cycle.cycleMembers.some((cm) => cm.isExcluded) &&
                  ` / ${cycle.cycleMembers.filter((cm) => cm.isExcluded).length}명 제외`})
              </p>
              <div className="flex flex-wrap gap-2">
                {cycle.cycleMembers
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cm, idx) => (
                    <span
                      key={cm.member.id}
                      className={`text-xs px-2 py-1 rounded-full ${
                        cm.isExcluded
                          ? "bg-red-50 text-red-400 line-through"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {idx + 1}. {cm.member.rank} {cm.member.name}
                    </span>
                  ))}
              </div>
            </div>

            {/* 현재 편성중 표시 */}
            {isCurrentlyActive(cycle) && (
              <div className="flex justify-end">
                <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  현재 편성중
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
