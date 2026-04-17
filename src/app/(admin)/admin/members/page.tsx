"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminBackButton } from "@/components/Admin/AdminBackButton";

interface Member {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  position: string | null;
  role: string;
  isActive: boolean;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function toggleRole(member: Member) {
    const newRole = member.role === "UNIT_ADMIN" ? "USER" : "UNIT_ADMIN";
    await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    load();
  }

  async function toggleActive(member: Member) {
    await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    load();
  }

  if (loading) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;

  return (
    <div className="space-y-5">
      <AdminBackButton />
      <h1 className="text-2xl font-bold text-gray-900">간부 관리</h1>

      <div className="space-y-3">
        {members.map((m) => (
          <div
            key={m.id}
            className={`bg-white rounded-xl shadow-sm p-4 ${!m.isActive ? "opacity-60" : ""}`}
          >
            {/* 상단: 이름 + 상태 배지 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{m.rank} {m.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{m.militaryId}</p>
                {m.position && (
                  <p className="text-xs text-gray-500 mt-0.5">{m.position}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === "UNIT_ADMIN"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m.role === "UNIT_ADMIN" ? "관리자" : "일반"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    m.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}
                >
                  {m.isActive ? "활성" : "비활성"}
                </span>
              </div>
            </div>

            {/* 하단: 액션 버튼 */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => toggleRole(m)}
              >
                {m.role === "UNIT_ADMIN" ? "일반으로 전환" : "관리자로 전환"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => toggleActive(m)}
              >
                {m.isActive ? "비활성화" : "활성화"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-center text-gray-400 py-8">등록된 간부가 없습니다.</p>
      )}
    </div>
  );
}
