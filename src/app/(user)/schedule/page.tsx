"use client";

import { useEffect, useState } from "react";
import { DutyCalendar } from "@/components/DutyCalendar/DutyCalendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{
    assignments: Parameters<typeof DutyCalendar>[0]["assignments"];
    holidays: Parameters<typeof DutyCalendar>[0]["holidays"];
  } | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedule?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          assignments: d.assignments ?? [],
          holidays: d.holidays ?? [],
        });
      })
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
        <h1 className="text-xl font-bold text-gray-900">당직근무표</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm font-medium text-gray-700 w-20 text-center">
            {year}년 {month}월
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          로딩 중...
        </div>
      ) : data ? (
        <DutyCalendar
          year={year}
          month={month}
          assignments={data.assignments}
          holidays={data.holidays}
          currentMemberId={me?.id}
        />
      ) : null}
    </div>
  );
}
