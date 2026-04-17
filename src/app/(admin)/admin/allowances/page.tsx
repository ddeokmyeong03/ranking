"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatKRW } from "@/lib/utils";
import { DutyType } from "@prisma/client";
import { AdminBackButton } from "@/components/Admin/AdminBackButton";

interface Rate {
  id: string;
  dutyType: DutyType;
  amountKRW: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

const DUTY_LABELS: Record<DutyType, string> = {
  WEEKDAY: "평일 당직",
  WEEKEND_DAY: "주말 주간 당직",
  WEEKEND_NIGHT: "주말 야간 당직",
};

export default function AdminAllowancesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [form, setForm] = useState({
    dutyType: "WEEKDAY" as DutyType,
    amountKRW: "",
    effectiveFrom: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    fetch("/api/allowance-rates")
      .then((r) => r.json())
      .then(setRates);
  };

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/allowance-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dutyType: form.dutyType,
          amountKRW: parseInt(form.amountKRW),
          effectiveFrom: form.effectiveFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }

      setForm({ dutyType: "WEEKDAY", amountKRW: "", effectiveFrom: "" });
      load();
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminBackButton />
      <h1 className="text-2xl font-bold text-gray-900">수당 요율 설정</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">요율 등록</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">근무 유형</label>
            <select
              value={form.dutyType}
              onChange={(e) => setForm((p) => ({ ...p, dutyType: e.target.value as DutyType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(DUTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <Input
            label="금액 (원)"
            type="number"
            value={form.amountKRW}
            onChange={(e) => setForm((p) => ({ ...p, amountKRW: e.target.value }))}
            placeholder="예) 50000"
            required
          />
          <Input
            label="적용 시작일"
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "등록 중..." : "등록"}</Button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">현재 요율</h2>
        </div>
        {rates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">등록된 요율이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">근무 유형</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">금액</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">적용 시작일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rates.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-gray-900">{DUTY_LABELS[r.dutyType]}</td>
                  <td className="px-5 py-3 font-medium text-green-700">{formatKRW(r.amountKRW)}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {r.effectiveFrom.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
