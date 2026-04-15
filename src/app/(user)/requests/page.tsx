"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DutyTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DutyType } from "@prisma/client";

interface Member {
  id: string;
  name: string;
  rank: string;
}

interface Assignment {
  date: string;
  dutyType: DutyType;
}

interface Request {
  id: string;
  status: string;
  message: string | null;
  requester?: Member;
  targetMember?: Member;
  requesterAssignment: Assignment;
  targetAssignment: Assignment;
}

export default function RequestsPage() {
  const [sent, setSent] = useState<Request[]>([]);
  const [received, setReceived] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((d) => {
        setSent(d.sent ?? []);
        setReceived(d.received ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      alert(action === "approve" ? "승인되었습니다." : "거절되었습니다.");
      load();
    }
  }

  const statusLabel = (s: string) =>
    s === "PENDING" ? "대기 중" : s === "APPROVED" ? "승인됨" : "거절됨";

  const statusColor = (s: string) =>
    s === "PENDING"
      ? "text-orange-600 bg-orange-50"
      : s === "APPROVED"
      ? "text-green-600 bg-green-50"
      : "text-gray-500 bg-gray-50";

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">당직 변경 요청</h1>

      {/* Received */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          받은 요청
        </h2>
        {received.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm text-center">
            받은 요청이 없습니다.
          </p>
        ) : (
          received.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {req.requester?.rank} {req.requester?.name}님의 요청
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(req.status)}`}>
                  {statusLabel(req.status)}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span>상대방:</span>
                  <DutyTypeBadge type={req.requesterAssignment.dutyType} />
                  <span>{format(new Date(req.requesterAssignment.date), "M월 d일 (eee)", { locale: ko })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>내 근무:</span>
                  <DutyTypeBadge type={req.targetAssignment.dutyType} />
                  <span>{format(new Date(req.targetAssignment.date), "M월 d일 (eee)", { locale: ko })}</span>
                </div>
              </div>
              {req.message && <p className="text-xs text-gray-400">{req.message}</p>}
              {req.status === "PENDING" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => handleAction(req.id, "approve")}>승인</Button>
                  <Button variant="danger" size="sm" onClick={() => handleAction(req.id, "reject")}>거절</Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sent */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          보낸 요청
        </h2>
        {sent.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl p-4 shadow-sm text-center">
            보낸 요청이 없습니다.
          </p>
        ) : (
          sent.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {req.targetMember?.rank} {req.targetMember?.name}님에게
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(req.status)}`}>
                  {statusLabel(req.status)}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span>내 근무:</span>
                  <DutyTypeBadge type={req.requesterAssignment.dutyType} />
                  <span>{format(new Date(req.requesterAssignment.date), "M월 d일 (eee)", { locale: ko })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>요청 날짜:</span>
                  <DutyTypeBadge type={req.targetAssignment.dutyType} />
                  <span>{format(new Date(req.targetAssignment.date), "M월 d일 (eee)", { locale: ko })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
