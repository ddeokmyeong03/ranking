"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Holiday {
  id: string;
  date: string;
  type: "PUBLIC_HOLIDAY" | "COMBAT_REST";
  name: string | null;
}

export default function AdminHolidaysPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [form, setForm] = useState({ date: "", type: "PUBLIC_HOLIDAY", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch(`/api/holidays?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setHolidays);
  };

  useEffect(() => { load(); }, [year, month]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      setForm({ date: "", type: "PUBLIC_HOLIDAY", name: "" });
      load();
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">공휴일 / 전투휴무 관리</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">등록</h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="날짜"
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">유형</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="PUBLIC_HOLIDAY">공휴일</option>
              <option value="COMBAT_REST">전투휴무</option>
            </select>
          </div>
        </div>

        <Input
          label="명칭 (선택)"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="예) 광복절, 연대 전투휴무"
        />

        {form.type === "COMBAT_REST" && (
          <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            전투휴무 등록 시 해당 날짜의 평일 당직이 주말 당직(주간+야간)으로 자동 전환됩니다.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "등록 중..." : "등록"}
        </Button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">등록된 휴일 ({year}년 {month}월)</h2>
        </div>
        {holidays.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">등록된 휴일이 없습니다.</p>
        ) : (
          <div className="divide-y">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(h.date), "M월 d일 (eee)", { locale: ko })}
                  </span>
                  {h.name && <span className="ml-2 text-sm text-gray-500">{h.name}</span>}
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      h.type === "COMBAT_REST"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {h.type === "COMBAT_REST" ? "전투휴무" : "공휴일"}
                  </span>
                </div>
                <Button variant="danger" size="sm" onClick={() => handleDelete(h.id)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
