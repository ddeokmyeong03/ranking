"use client";

import { useEffect, useState } from "react";
import { DutyCalendar } from "@/components/DutyCalendar/DutyCalendar";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyType, LeaveType } from "@prisma/client";
import { dutyTypeLabel, dutyTypeColor } from "@/lib/utils";

type AssignmentItem = {
  id: string;
  date: Date;
  dutyType: DutyType;
  memberId: string;
  unitId: string;
  isSwapped: boolean;
  originalMemberId: string | null;
  cycleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: { id: string; name: string; rank: string };
};

type MemberInfo = {
  id: string;
  name: string;
  rank: string;
  role: string;
  unit: { name: string };
};

type MyAssignment = { id: string; date: string; dutyType: DutyType };

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [member, setMember] = useState<MemberInfo | null>(null);
  const [data, setData] = useState<{
    assignments: AssignmentItem[];
    holidays: Parameters<typeof DutyCalendar>[0]["holidays"];
  } | null>(null);
  const [listingDates, setListingDates] = useState<{ date: Date }[]>([]);
  const [upcomingDuties, setUpcomingDuties] = useState<AssignmentItem[]>([]);
  const [openListingsCount, setOpenListingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 휴가/휴무 상태
  const [leaves, setLeaves] = useState<{ id: string; startDate: string; endDate: string; leaveType: LeaveType; reason: string | null }[]>([]);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", leaveType: "VACATION" as LeaveType, reason: "" });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // Modal state
  const [modal, setModal] = useState<"listing" | "request" | null>(null);
  const [selected, setSelected] = useState<AssignmentItem | null>(null);
  const [message, setMessage] = useState("");
  const [myAssignments, setMyAssignments] = useState<MyAssignment[]>([]);
  const [selectedMyAssignmentId, setSelectedMyAssignmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load member info
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMember(d));
  }, []);

  // Load leaves
  function loadLeaves() {
    fetch(`/api/leaves?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => setLeaves(Array.isArray(d) ? d : []));
  }
  useEffect(() => { loadLeaves(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddLeave() {
    setLeaveError("");
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setLeaveError("시작일과 종료일을 입력해주세요.");
      return;
    }
    setLeaveSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });
      const d = await res.json();
      if (!res.ok) { setLeaveError(d.error ?? "등록 실패"); return; }
      setLeaveModal(false);
      setLeaveForm({ startDate: "", endDate: "", leaveType: "VACATION", reason: "" });
      loadLeaves();
    } catch {
      setLeaveError("서버 오류가 발생했습니다.");
    } finally {
      setLeaveSubmitting(false);
    }
  }

  async function handleDeleteLeave(id: string) {
    if (!confirm("휴가/휴무를 삭제하시겠습니까?")) return;
    await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    loadLeaves();
  }

  // Load schedule + listings
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/schedule?year=${year}&month=${month}`).then((r) => r.json()),
      fetch("/api/listings").then((r) => r.json()),
    ]).then(([scheduleData, listingsData]) => {
      const assignments: AssignmentItem[] = scheduleData.assignments ?? [];
      setData({ assignments, holidays: scheduleData.holidays ?? [] });
      setListingDates(
        (listingsData ?? []).map((l: { assignment: { date: string } }) => ({
          date: new Date(l.assignment.date),
        }))
      );
      setOpenListingsCount((listingsData ?? []).length);

      // Upcoming duties for current member
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setUpcomingDuties(
        assignments
          .filter(
            (a) =>
              a.memberId === member?.id &&
              new Date(a.date) >= today
          )
          .slice(0, 3)
      );

      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, member?.id]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function handleAssignmentClick(assignment: AssignmentItem) {
    setSelected(assignment);
    setMessage("");
    setError("");
    setSelectedMyAssignmentId("");

    if (assignment.memberId === member?.id) {
      setModal("listing");
    } else {
      const myA = (data?.assignments ?? []).filter(
        (a) => a.memberId === member?.id && a.id !== assignment.id
      );
      setMyAssignments(
        myA.map((a) => ({ id: a.id, date: String(a.date), dutyType: a.dutyType }))
      );
      setModal("request");
    }
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setMessage("");
    setError("");
    setSelectedMyAssignmentId("");
  }

  async function handlePostListing() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: selected.id, message: message || undefined }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "등록에 실패했습니다."); return; }

      fetch("/api/listings").then((r) => r.json()).then((listingsData) => {
        setListingDates(
          (listingsData ?? []).map((l: { assignment: { date: string } }) => ({
            date: new Date(l.assignment.date),
          }))
        );
        setOpenListingsCount((listingsData ?? []).length);
      });
      closeModal();
      alert("변경 희망이 등록되었습니다. 다른 부대원에게 알림이 전송됩니다.");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendRequest() {
    if (!selected || !selectedMyAssignmentId) {
      setError("내 근무를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterAssignmentId: selectedMyAssignmentId,
          targetAssignmentId: selected.id,
          message: message || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "요청에 실패했습니다."); return; }
      closeModal();
      alert(`${selected.member.rank} ${selected.member.name}님께 변경 요청을 보냈습니다.`);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const thisMonthMyDuties = (data?.assignments ?? []).filter(
    (a) => a.memberId === member?.id
  ).length;

  return (
    <div className="space-y-5 pb-24">
      {/* 인사말 */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm">안녕하세요,</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {member ? `${member.rank} ${member.name}님` : "로딩 중..."}
        </h1>
        {member && <p className="text-green-100 text-sm mt-0.5">{member.unit.name}</p>}
        <div className="flex gap-4 mt-3 text-sm">
          <span className="bg-green-800/40 rounded-lg px-3 py-1">
            이달 당직 <strong>{thisMonthMyDuties}회</strong>
          </span>
          <span className="bg-orange-500/80 rounded-lg px-3 py-1">
            변경 희망 <strong>{openListingsCount}건</strong>
          </span>
        </div>
      </div>

      {/* 달력 네비게이션 */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-gray-900">당직근무표</h2>
        <div className="flex items-center gap-1">
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
      <p className="text-xs text-gray-400 px-1">근무를 탭하면 변경 희망 등록 또는 직접 요청을 보낼 수 있습니다.</p>

      {/* 근무표 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">로딩 중...</div>
      ) : data ? (
        <DutyCalendar
          year={year}
          month={month}
          assignments={data.assignments}
          holidays={data.holidays}
          listingDates={listingDates}
          currentMemberId={member?.id}
          onAssignmentClick={handleAssignmentClick}
        />
      ) : null}

      {/* 다가오는 당직 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">다가오는 당직</h2>
        {upcomingDuties.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">예정된 당직이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {upcomingDuties.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">
                  {format(new Date(a.date), "M월 d일 (eee)", { locale: ko })}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${dutyTypeColor(a.dutyType)}`}>
                  {dutyTypeLabel(a.dutyType)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 휴가/휴무 관리 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">내 휴가/휴무</h2>
          <button
            onClick={() => setLeaveModal(true)}
            className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
          >
            + 등록
          </button>
        </div>
        {leaves.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">등록된 휴가/휴무가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                    l.leaveType === "VACATION" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {l.leaveType === "VACATION" ? "휴가" : "휴무"}
                  </span>
                  <span className="text-sm text-gray-800">
                    {format(new Date(l.startDate), "M.d", { locale: ko })}
                    {l.startDate !== l.endDate && ` ~ ${format(new Date(l.endDate), "M.d", { locale: ko })}`}
                  </span>
                  {l.reason && <span className="text-xs text-gray-400 ml-2">{l.reason}</span>}
                </div>
                <button
                  onClick={() => handleDeleteLeave(l.id)}
                  className="text-gray-300 hover:text-red-400 text-sm p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 관리자 링크 */}
      {member?.role === "UNIT_ADMIN" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800">관리자 메뉴</p>
          <a href="/admin" className="mt-1 text-sm text-yellow-700 underline hover:text-yellow-900">
            관리자 대시보드 →
          </a>
        </div>
      )}

      {/* ── 휴가/휴무 등록 모달 ── */}
      {leaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">휴가/휴무 등록</h2>
              <button onClick={() => setLeaveModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">유형</label>
              <div className="flex gap-2">
                {(["VACATION", "DAY_OFF"] as LeaveType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLeaveForm((p) => ({ ...p, leaveType: t }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      leaveForm.leaveType === t
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t === "VACATION" ? "휴가" : "휴무"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">시작일</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">종료일</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">사유 (선택)</label>
              <input
                type="text"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="예) 연가, 청원휴가 등"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {leaveError && <p className="text-sm text-red-600">{leaveError}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setLeaveModal(false)} disabled={leaveSubmitting}>취소</Button>
              <Button className="flex-1" onClick={handleAddLeave} disabled={leaveSubmitting}>
                {leaveSubmitting ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 변경 희망 등록 모달 ── */}
      {modal === "listing" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">변경 희망 등록</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2">
                <DutyTypeBadge type={selected.dutyType} />
                <span className="text-sm font-medium text-gray-800">
                  {format(new Date(selected.date), "M월 d일 (eee)", { locale: ko })}
                </span>
              </div>
              <p className="text-xs text-gray-500">내 근무를 변경 희망으로 등록합니다.</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">메모 (선택)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="예) 오후부터 가능합니다"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={submitting}>취소</Button>
              <Button className="flex-1" onClick={handlePostListing} disabled={submitting}>
                {submitting ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 직접 변경 요청 모달 ── */}
      {modal === "request" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">직접 변경 요청</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">요청 대상 근무</p>
              <div className="flex items-center gap-2">
                <DutyTypeBadge type={selected.dutyType} />
                <span className="text-sm font-medium text-gray-800">
                  {format(new Date(selected.date), "M월 d일 (eee)", { locale: ko })}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selected.member.rank} {selected.member.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">내 근무 선택 (교환 제안)</label>
              {myAssignments.length === 0 ? (
                <p className="text-sm text-gray-400">이번 달 교환 가능한 내 근무가 없습니다.</p>
              ) : (
                <select
                  value={selectedMyAssignmentId}
                  onChange={(e) => setSelectedMyAssignmentId(e.target.value)}
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
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">메모 (선택)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="예) 급한 사정이 생겼습니다"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={submitting}>취소</Button>
              <Button
                className="flex-1"
                onClick={handleSendRequest}
                disabled={submitting || myAssignments.length === 0}
              >
                {submitting ? "전송 중..." : "요청 보내기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
