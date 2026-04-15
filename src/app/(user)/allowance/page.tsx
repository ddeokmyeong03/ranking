"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatKRW } from "@/lib/utils";
import { DutyType } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Breakdown {
  date: Date;
  dutyType: DutyType;
  amountKRW: number;
}

export default function AllowancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{ total: number; count: number; breakdown: Breakdown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/allowance?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">수당 계산</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <span className="text-sm font-medium w-20 text-center">{year}년 {month}월</span>
          <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight size={16} /></Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">로딩 중...</p>
      ) : data ? (
        <>
          <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white text-center">
            <p className="text-green-100 text-sm">이달 예상 수당</p>
            <p className="text-3xl font-bold mt-1">{formatKRW(data.total)}</p>
            <p className="text-green-100 text-sm mt-1">총 {data.count}회 당직</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">근무별 내역</h2>
            </div>
            {data.breakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">이달 편성된 근무가 없습니다.</p>
            ) : (
              <div className="divide-y">
                {data.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <DutyTypeBadge type={b.dutyType} />
                      <span className="text-sm text-gray-700">
                        {format(new Date(b.date), "M월 d일 (eee)", { locale: ko })}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatKRW(b.amountKRW)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
