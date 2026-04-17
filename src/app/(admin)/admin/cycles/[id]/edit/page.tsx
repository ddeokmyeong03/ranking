"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { subDays, subMonths, format } from "date-fns";
import { AdminBackButton } from "@/components/Admin/AdminBackButton";

interface MemberInCycle {
  id: string;
  name: string;
  rank: string;
  isActive: boolean;
  transferOrderDate: string | null;
  dischargeDate: string | null;
}

interface CycleMemberEntry {
  sortOrder: number;
  isExcluded: boolean;
  member: MemberInCycle;
}

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  weekdayStartOffset: number;
  weekendAStartOffset: number;
  weekendBStartOffset: number;
  cycleMembers: CycleMemberEntry[];
}

interface AllMember {
  id: string;
  name: string;
  rank: string;
  isActive: boolean;
}

/** 자동 제외 여부와 이유를 계산 */
function autoExcludeReason(member: MemberInCycle, cycleStartDate: string): string | null {
  const today = new Date(cycleStartDate);
  if (member.transferOrderDate) {
    const excludeFrom = subDays(new Date(member.transferOrderDate), 14);
    if (today >= excludeFrom) return "전출 (인사명령 2주 이내)";
  }
  if (member.dischargeDate) {
    const excludeFrom = subMonths(new Date(member.dischargeDate), 1);
    if (today >= excludeFrom) return "전역 (전역일 1개월 이내)";
  }
  return null;
}

export default function EditCyclePage() {
  const router = useRouter();
  const { id: cycleId } = useParams<{ id: string }>();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [allMembers, setAllMembers] = useState<AllMember[]>([]);

  // 편집 상태
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);      // 순서 배열
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set()); // 제외 여부
  const [weekdayOffset, setWeekdayOffset] = useState(0);
  const [weekendAOffset, setWeekendAOffset] = useState(0);
  const [weekendBOffset, setWeekendBOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/cycles/${cycleId}`).then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([cycleData, membersData]: [Cycle, AllMember[]]) => {
      setCycle(cycleData);
      setAllMembers(membersData);
      setName(cycleData.name);
      setStartDate(cycleData.startDate.slice(0, 10));
      setEndDate(cycleData.endDate.slice(0, 10));
      setWeekdayOffset(cycleData.weekdayStartOffset);
      setWeekendAOffset(cycleData.weekendAStartOffset);
      setWeekendBOffset(cycleData.weekendBStartOffset);

      const sorted = [...cycleData.cycleMembers].sort((a, b) => a.sortOrder - b.sortOrder);
      setOrderedIds(sorted.map((cm) => cm.member.id));
      setExcludedIds(new Set(sorted.filter((cm) => cm.isExcluded).map((cm) => cm.member.id)));
    }).finally(() => setLoading(false));
  }, [cycleId]);

  // 현재 사이클에 없는 활성 멤버 (새로 추가 가능)
  const existingIds = new Set(orderedIds);
  const addableMembers = allMembers.filter((m) => m.isActive && !existingIds.has(m.id));

  function getMemberInfo(id: string): MemberInCycle | undefined {
    const cm = cycle?.cycleMembers.find((c) => c.member.id === id);
    if (cm) return cm.member;
    const m = allMembers.find((m) => m.id === id);
    if (m) return { ...m, transferOrderDate: null, dischargeDate: null };
    return undefined;
  }

  function moveUp(id: string) {
    setOrderedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }

  function moveDown(id: string) {
    setOrderedIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }

  function removeMember(id: string) {
    setOrderedIds((prev) => prev.filter((i) => i !== id));
    setExcludedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function addMember(id: string) {
    setOrderedIds((prev) => [...prev, id]);
  }

  function toggleExclude(id: string) {
    setExcludedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          memberIds: orderedIds,
          excludedMemberIds: Array.from(excludedIds),
          weekdayStartOffset: weekdayOffset,
          weekendAStartOffset: weekendAOffset,
          weekendBStartOffset: weekendBOffset,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/admin/cycles");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;
  if (!cycle) return <p className="text-center text-red-500 py-8">사이클을 찾을 수 없습니다.</p>;

  const maxOffset = Math.max(0, orderedIds.length - 1);

  return (
    <div className="space-y-6 pb-10">
      <AdminBackButton />
      <h1 className="text-2xl font-bold text-gray-900">사이클 수정</h1>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">기본 정보</h2>
        <Input label="사이클명" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="시작일" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="종료일" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>

      {/* 멤버 순서 및 제외 관리 */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">편성 순서 및 제외 관리</h2>
        <p className="text-xs text-gray-400">
          순서 조정, 제외 토글, 또는 멤버 삭제가 가능합니다.
          <br />제외된 멤버는 당직근무 편성 시 건너뜁니다.
        </p>

        <div className="space-y-2">
          {orderedIds.map((id, idx) => {
            const member = getMemberInfo(id);
            if (!member) return null;
            const isExcluded = excludedIds.has(id);
            const autoReason = autoExcludeReason(member, startDate);
            // 2주 뒤부터 투입될 신규 전입자 여부
            const isNewArrival = member.transferOrderDate === null &&
              !cycle.cycleMembers.find((cm) => cm.member.id === id);

            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  isExcluded ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${isExcluded ? "line-through text-gray-400" : "text-gray-700"}`}>
                    {member.rank} {member.name}
                  </span>
                  {autoReason && (
                    <span className="ml-2 text-xs text-red-500">{autoReason}</span>
                  )}
                  {isNewArrival && (
                    <span className="ml-2 text-xs text-blue-500">신규 전입</span>
                  )}
                  {member.transferOrderDate && (
                    <span className="ml-2 text-xs text-orange-500">
                      전출일: {format(new Date(member.transferOrderDate), "yyyy.MM.dd")}
                    </span>
                  )}
                  {member.dischargeDate && (
                    <span className="ml-2 text-xs text-purple-500">
                      전역일: {format(new Date(member.dischargeDate), "yyyy.MM.dd")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(id)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-sm"
                    title="위로"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveDown(id)}
                    disabled={idx === orderedIds.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-sm"
                    title="아래로"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => toggleExclude(id)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isExcluded
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                    title={isExcluded ? "제외 해제" : "제외 처리"}
                  >
                    {isExcluded ? "제외됨" : "제외"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMember(id)}
                    className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 text-sm"
                    title="목록에서 삭제"
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 신규 멤버 추가 */}
        {addableMembers.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">전입자 추가</p>
            <div className="flex flex-wrap gap-2">
              {addableMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => addMember(m.id)}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100"
                >
                  + {m.rank} {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 순번 시작점 */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">순번 시작점 설정</h2>
          <p className="text-xs text-gray-500 mt-1">각 당직 유형의 첫 번째 담당자를 설정합니다.</p>
        </div>

        <div className="space-y-3">
          {[
            { label: "평일 순번", value: weekdayOffset, setter: setWeekdayOffset },
            { label: "주말A 순번", value: weekendAOffset, setter: setWeekendAOffset },
            { label: "주말B 순번", value: weekendBOffset, setter: setWeekendBOffset },
          ].map(({ label, value, setter }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 text-sm text-gray-700 shrink-0">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxOffset}
                  value={value}
                  onChange={(e) =>
                    setter(Math.min(maxOffset, Math.max(0, Number(e.target.value))))
                  }
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                />
                {orderedIds[value] && (
                  <span className="text-xs text-gray-500">
                    → {getMemberInfo(orderedIds[value])?.rank}{" "}
                    {getMemberInfo(orderedIds[value])?.name}부터
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">순번 설명</p>
          <p>• 평일 순번: 월~금 당직 (16:00~익일 09:00)</p>
          <p>• 주말A 순번: 토·일 주간 당직, 토요일 야간, 전투휴무·공휴일</p>
          <p>• 주말B 순번: 일요일 야간 당직 (20:30~익일 09:00)</p>
        </div>
      </div>

      {/* 전입자 안내 */}
      <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p className="font-semibold">인원 변동 처리 안내</p>
        <p>• <strong>전출자</strong>: 인사 명령일을 멤버 정보에 등록하면 2주 전부터 자동 식별됩니다. 제외 처리 후 저장하세요.</p>
        <p>• <strong>전역자</strong>: 전역일이 등록된 경우 1개월 전부터 자동 식별됩니다. 제외 처리 후 저장하세요.</p>
        <p>• <strong>전입자</strong>: 위 전입자 추가 버튼으로 추가하고, 전입일로부터 2주 후부터 순번에 투입됩니다.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "저장 중..." : "변경 사항 저장"}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </div>
  );
}
