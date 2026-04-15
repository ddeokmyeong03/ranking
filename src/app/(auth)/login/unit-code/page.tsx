"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function UnitCodePage() {
  const router = useRouter();
  const [unitCode, setUnitCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login/unit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitCode: unitCode.toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "인증에 실패했습니다.");
        return;
      }

      if (trustDevice) {
        await fetch("/api/auth/trusted-device", { method: "POST" });
      }

      router.push("/dashboard");
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        관리자로부터 발급받은 부대코드를 입력해주세요.
      </div>

      <Input
        label="부대코드"
        type="text"
        value={unitCode}
        onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
        placeholder="예) ABC123"
        maxLength={6}
        required
        autoComplete="off"
      />

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(e) => setTrustDevice(e.target.checked)}
          className="rounded"
        />
        이 기기를 신뢰하여 자동 로그인 사용
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "확인 중..." : "로그인"}
      </Button>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        ← 처음으로
      </button>
    </form>
  );
}
