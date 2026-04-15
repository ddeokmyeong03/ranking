"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUnit = searchParams.get("new") === "1";

  const [form, setForm] = useState({
    militaryId: "",
    password: "",
    confirmPassword: "",
    name: "",
    rank: "",
    unitCode: "",
    unitName: "", // for new unit
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      if (isNewUnit) {
        // Create new unit + admin
        const res = await fetch("/api/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitName: form.unitName,
            adminMilitaryId: form.militaryId,
            adminPassword: form.password,
            adminName: form.name,
            adminRank: form.rank,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "부대 생성에 실패했습니다.");
          return;
        }

        alert(`부대코드: ${data.unitCode}\n간부들에게 이 코드를 공유해주세요.`);
        router.push("/admin");
      } else {
        // Regular signup
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            militaryId: form.militaryId,
            password: form.password,
            name: form.name,
            rank: form.rank,
            unitCode: form.unitCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "회원가입에 실패했습니다.");
          return;
        }

        router.push("/login");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-center font-semibold text-gray-700">
        {isNewUnit ? "부대 생성 및 관리자 등록" : "회원가입"}
      </h2>

      {isNewUnit && (
        <Input
          label="부대명"
          value={form.unitName}
          onChange={(e) => update("unitName", e.target.value)}
          placeholder="예) 1사단 1연대 2대대"
          required
        />
      )}

      <Input
        label="군번"
        value={form.militaryId}
        onChange={(e) => update("militaryId", e.target.value)}
        placeholder="예) 22-12345678"
        required
      />

      <Input
        label="이름"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="성명"
        required
      />

      <Input
        label="계급"
        value={form.rank}
        onChange={(e) => update("rank", e.target.value)}
        placeholder="예) 중위"
        required
      />

      {!isNewUnit && (
        <Input
          label="부대코드"
          value={form.unitCode}
          onChange={(e) => update("unitCode", e.target.value.toUpperCase())}
          placeholder="관리자에게 받은 6자리 코드"
          maxLength={6}
          required
        />
      )}

      <Input
        label="비밀번호"
        type="password"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
        placeholder="8자 이상"
        required
        minLength={8}
      />

      <Input
        label="비밀번호 확인"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => update("confirmPassword", e.target.value)}
        placeholder="비밀번호 재입력"
        required
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "처리 중..." : isNewUnit ? "부대 생성" : "회원가입"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-green-700 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
