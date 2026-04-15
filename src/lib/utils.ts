import { nanoid } from "nanoid";
import { DutyType } from "@prisma/client";

export function generateUnitCode(): string {
  return nanoid(6).toUpperCase();
}

export function dutyTypeLabel(type: DutyType): string {
  const labels: Record<DutyType, string> = {
    WEEKDAY: "평일 당직",
    WEEKEND_DAY: "주말 주간 당직",
    WEEKEND_NIGHT: "주말 야간 당직",
  };
  return labels[type];
}

export function dutyTypeColor(type: DutyType): string {
  const colors: Record<DutyType, string> = {
    WEEKDAY: "bg-blue-100 text-blue-800",
    WEEKEND_DAY: "bg-green-100 text-green-800",
    WEEKEND_NIGHT: "bg-purple-100 text-purple-800",
  };
  return colors[type];
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}
