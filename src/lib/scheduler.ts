import { DutyType, HolidayType } from "@prisma/client";
import {
  eachDayOfInterval,
  isWeekend,
  startOfDay,
  format,
} from "date-fns";

export interface ScheduleInput {
  cycleId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  cycleMembers: { memberId: string; sortOrder: number }[];
  holidays: { date: Date; type: HolidayType }[];
}

export interface AssignmentSlot {
  unitId: string;
  cycleId: string;
  memberId: string;
  date: Date;
  dutyType: DutyType;
}

interface MemberState {
  memberId: string;
  sortOrder: number;
  counts: Record<DutyType, number>;
}

function isHolidayOrCombatRest(
  date: Date,
  holidays: { date: Date; type: HolidayType }[]
): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  return holidays.some(
    (h) => format(h.date, "yyyy-MM-dd") === dateStr
  );
}

function getSlotsForDay(
  date: Date,
  holidays: { date: Date; type: HolidayType }[]
): DutyType[] {
  if (isWeekend(date) || isHolidayOrCombatRest(date, holidays)) {
    return [DutyType.WEEKEND_DAY, DutyType.WEEKEND_NIGHT];
  }
  return [DutyType.WEEKDAY];
}

function pickMember(
  members: MemberState[],
  dutyType: DutyType,
  assignedTodayIds: Set<string>
): MemberState | null {
  // Filter out members already assigned today
  const candidates = members.filter((m) => !assignedTodayIds.has(m.memberId));
  if (candidates.length === 0) return null;

  // Sort by count for this dutyType ASC, then by sortOrder ASC as tiebreak
  candidates.sort((a, b) => {
    const diff = a.counts[dutyType] - b.counts[dutyType];
    if (diff !== 0) return diff;
    return a.sortOrder - b.sortOrder;
  });

  return candidates[0];
}

export function generateSchedule(input: ScheduleInput): AssignmentSlot[] {
  const { cycleId, unitId, startDate, endDate, cycleMembers, holidays } = input;

  if (cycleMembers.length === 0) return [];

  const members: MemberState[] = cycleMembers.map((cm) => ({
    memberId: cm.memberId,
    sortOrder: cm.sortOrder,
    counts: {
      [DutyType.WEEKDAY]: 0,
      [DutyType.WEEKEND_DAY]: 0,
      [DutyType.WEEKEND_NIGHT]: 0,
    },
  }));

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const assignments: AssignmentSlot[] = [];

  for (const day of days) {
    const slots = getSlotsForDay(day, holidays);
    const assignedTodayIds = new Set<string>();

    for (const dutyType of slots) {
      const member = pickMember(members, dutyType, assignedTodayIds);
      if (!member) continue;

      assignments.push({
        unitId,
        cycleId,
        memberId: member.memberId,
        date: startOfDay(day),
        dutyType,
      });

      member.counts[dutyType]++;
      assignedTodayIds.add(member.memberId);
    }
  }

  return assignments;
}

// Returns slots for a single day (used when a combat rest holiday is added)
export function generateSlotsForDay(
  date: Date,
  unitId: string,
  cycleId: string,
  cycleMembers: { memberId: string; sortOrder: number }[],
  existingCounts: Record<string, Record<DutyType, number>>
): AssignmentSlot[] {
  const slots = [DutyType.WEEKEND_DAY, DutyType.WEEKEND_NIGHT];

  const members: MemberState[] = cycleMembers.map((cm) => ({
    memberId: cm.memberId,
    sortOrder: cm.sortOrder,
    counts: existingCounts[cm.memberId] ?? {
      [DutyType.WEEKDAY]: 0,
      [DutyType.WEEKEND_DAY]: 0,
      [DutyType.WEEKEND_NIGHT]: 0,
    },
  }));

  const assignments: AssignmentSlot[] = [];
  const assignedTodayIds = new Set<string>();

  for (const dutyType of slots) {
    const member = pickMember(members, dutyType, assignedTodayIds);
    if (!member) continue;

    assignments.push({
      unitId,
      cycleId,
      memberId: member.memberId,
      date: startOfDay(date),
      dutyType,
    });

    member.counts[dutyType]++;
    assignedTodayIds.add(member.memberId);
  }

  return assignments;
}
