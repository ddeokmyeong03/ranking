"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Member {
  id: string;
  name: string;
  rank: string;
  isActive: boolean;
}

export default function NewCyclePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(data.filter((m: Member) => m.isActive)));
  }, []);

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function moveUp(id: string) {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }

  function moveDown(id: string) {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (selectedIds.length === 0) {
      setError("최소 1명 이상의 간부를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          memberIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "사이클 생성에 실패했습니다.");
        return;
      }

      router.push("/admin/cycles");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const getMember = (id: string) => members.find((m) => m.id === id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">새 사이클 생성</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">기본 정보</h2>
          <Input
            label="사이클명"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="예) 2025년 5월 사이클"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작일"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              required
            />
            <Input
              label="종료일"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">편성 대상 간부 선택</h2>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {members.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedIds.includes(m.id)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  {m.rank} {m.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">편성 순서 설정</h2>
            <p className="text-xs text-gray-400">위아래 버튼으로 순서를 조정하세요.</p>
            <div className="space-y-2">
              {selectedIds.map((id, idx) => {
                const member = getMember(id);
                if (!member) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {idx + 1}. {member.rank} {member.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveUp(id)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(id)}
                        disabled={idx === selectedIds.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "생성 중..." : "사이클 생성"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
