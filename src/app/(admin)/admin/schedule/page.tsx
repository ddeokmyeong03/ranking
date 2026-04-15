"use client";

import { useEffect, useState } from "react";
import { DutyCalendar } from "@/components/DutyCalendar/DutyCalendar";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{
    assignments: Parameters<typeof DutyCalendar>[0]["assignments"];
    holidays: Parameters<typeof DutyCalendar>[0]["holidays"];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedule?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setData({ assignments: d.assignments ?? [], holidays: d.holidays ?? [] }))
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">근무표 (관리자)</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <span className="text-sm font-medium w-24 text-center">{year}년 {month}월</span>
          <Button variant="secondary" size="sm" onClick={nextMonth}><ChevronRight size={16} /></Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">로딩 중...</p>
      ) : data ? (
        <DutyCalendar
          year={year}
          month={month}
          assignments={data.assignments}
          holidays={data.holidays}
        />
      ) : null}
    </div>
  );
}
