"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

interface MemberProfile {
  id: string;
  militaryId: string;
  name: string;
  rank: string;
  position: string | null;
  commissionDate: string | null;
  dischargeDate: string | null;
  role: string;
  unit: { name: string };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [form, setForm] = useState({
    position: "",
    commissionDate: "",
    dischargeDate: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          position: data.position ?? "",
          commissionDate: data.commissionDate
            ? format(new Date(data.commissionDate), "yyyy-MM-dd")
            : "",
          dischargeDate: data.dischargeDate
            ? format(new Date(data.dischargeDate), "yyyy-MM-dd")
            : "",
          password: "",
          confirmPassword: "",
        });
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password && form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string | null | undefined> = {
        position: form.position || null,
        commissionDate: form.commissionDate || null,
        dischargeDate: form.dischargeDate || null,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(`/api/members/${profile?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess("프로필이 수정되었습니다.");
        setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        const data = await res.json();
        setError(data.error ?? "수정에 실패했습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) return <p className="text-center text-gray-400 py-8">로딩 중...</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">내 프로필</h1>

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
            🎖️
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {profile.rank} {profile.name}
            </p>
            <p className="text-sm text-gray-500">{profile.unit.name}</p>
            <p className="text-xs text-gray-400">군번: {profile.militaryId}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">정보 수정</h2>

        <Input
          label="보직"
          value={form.position}
          onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
          placeholder="예) 작전장교"
        />

        <Input
          label="임관일"
          type="date"
          value={form.commissionDate}
          onChange={(e) => setForm((p) => ({ ...p, commissionDate: e.target.value }))}
        />

        <Input
          label="전역일"
          type="date"
          value={form.dischargeDate}
          onChange={(e) => setForm((p) => ({ ...p, dischargeDate: e.target.value }))}
        />

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">비밀번호 변경 (선택)</p>
          <Input
            label="새 비밀번호"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="변경하지 않으려면 비워두세요"
            minLength={8}
          />
          {form.password && (
            <Input
              label="비밀번호 확인"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </Button>
      </form>

      {/* Logout */}
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="w-full text-sm text-red-600 hover:text-red-700 py-2"
      >
        로그아웃
      </button>
    </div>
  );
}
