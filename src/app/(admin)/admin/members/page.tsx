"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

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
      <h1 className="text-2xl font-bold text-gray-900">간부 관리</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">이름</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">군번</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">보직</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">역할</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">상태</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id} className={!m.isActive ? "opacity-50" : ""}>
                <td className="px-5 py-3 font-medium text-gray-900">
                  {m.rank} {m.name}
                </td>
                <td className="px-5 py-3 text-gray-500 font-mono">{m.militaryId}</td>
                <td className="px-5 py-3 text-gray-500">{m.position ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === "UNIT_ADMIN"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.role === "UNIT_ADMIN" ? "관리자" : "일반"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {m.isActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleRole(m)}>
                      {m.role === "UNIT_ADMIN" ? "일반 전환" : "관리자 전환"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(m)}>
                      {m.isActive ? "비활성화" : "활성화"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
