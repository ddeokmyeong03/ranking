import { DutyType } from "@prisma/client";
import { prisma } from "./prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export interface AllowanceBreakdown {
  date: Date;
  dutyType: DutyType;
  amountKRW: number;
}

export interface AllowanceResult {
  total: number;
  count: number;
  breakdown: AllowanceBreakdown[];
}

export async function calculateAllowance(
  memberId: string,
  year: number,
  month: number
): Promise<AllowanceResult> {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);

  const [assignments, member] = await Promise.all([
    prisma.dutyAssignment.findMany({
      where: {
        memberId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    }),
    prisma.member.findUnique({ where: { id: memberId }, select: { unitId: true } }),
  ]);

  if (!member) return { total: 0, count: 0, breakdown: [] };

  const rates = await prisma.allowanceRate.findMany({
    where: {
      unitId: member.unitId,
      effectiveFrom: { lte: end },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: start } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  function getRateForDuty(dutyType: DutyType, date: Date): number {
    const rate = rates.find(
      (r) =>
        r.dutyType === dutyType &&
        r.effectiveFrom <= date &&
        (r.effectiveTo === null || r.effectiveTo >= date)
    );
    return rate?.amountKRW ?? 0;
  }

  const breakdown: AllowanceBreakdown[] = assignments.map((a) => ({
    date: a.date,
    dutyType: a.dutyType,
    amountKRW: getRateForDuty(a.dutyType, a.date),
  }));

  const total = breakdown.reduce((sum, b) => sum + b.amountKRW, 0);

  return { total, count: assignments.length, breakdown };
}
