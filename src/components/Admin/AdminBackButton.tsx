"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function AdminBackButton() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
    >
      <ChevronLeft size={16} />
      관리자 대시보드
    </Link>
  );
}
