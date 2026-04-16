import { DutyType, HolidayType } from "@prisma/client";
import {
  eachDayOfInterval,
  isWeekend,
  startOfDay,
  format,
  subDays,
} from "date-fns";

export interface ScheduleInput {
  cycleId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  cycleMembers: { memberId: string; sortOrder: number }[];
  holidays: { date: Date; type: HolidayType }[];
  weekdayStartOffset: number;   // 평일 순번 시작 인덱스 (0부터)
  weekendAStartOffset: number;  // 주말A 순번 시작 인덱스
  weekendBStartOffset: number;  // 주말B 순번 시작 인덱스
}

export interface AssignmentSlot {
  unitId: string;
  cycleId: string;
  memberId: string;
  date: Date;
  dutyType: DutyType;
}

type RotationPool = "weekday" | "weekendA" | "weekendB";

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

/**
 * 각 근무 슬롯이 어느 풀(순번)에 속하는지 결정
 * - 평일(WEEKDAY): 평일 풀
 * - 일요일 야간(WEEKEND_NIGHT on Sunday): 주말B 풀
 * - 나머지 주말/공휴일 근무: 주말A 풀
 */
function getPool(date: Date, dutyType: DutyType): RotationPool {
  if (dutyType === DutyType.WEEKDAY) return "weekday";
  // 일요일(0)의 야간근무 → 주말B
  if (date.getDay() === 0 && dutyType === DutyType.WEEKEND_NIGHT) return "weekendB";
  return "weekendA";
}

/**
 * 연속근무 여부 확인:
 * - 전날 야간근무를 했으면 다음날 주간근무 배정 불가
 * - 전날 평일근무(16시~익일9시)를 했으면 당일 주간근무 배정 불가
 */
function hasConsecutiveConflict(
  memberId: string,
  date: Date,
  dutyType: DutyType,
  prevDayAssignments: Map<string, DutyType[]>
): boolean {
  if (dutyType !== DutyType.WEEKEND_DAY && dutyType !== DutyType.WEEKDAY) return false;

  const prevDateStr = format(subDays(date, 1), "yyyy-MM-dd");
  const prevAssignments = prevDayAssignments.get(`${memberId}:${prevDateStr}`) ?? [];

  // 전날 야간근무 또는 평일근무를 했으면 당일 주간(주말주간/평일) 배정 불가
  if (
    prevAssignments.includes(DutyType.WEEKEND_NIGHT) ||
    prevAssignments.includes(DutyType.WEEKDAY)
  ) {
    return true;
  }
  return false;
}

export function generateSchedule(input: ScheduleInput): AssignmentSlot[] {
  const {
    cycleId,
    unitId,
    startDate,
    endDate,
    cycleMembers,
    holidays,
    weekdayStartOffset,
    weekendAStartOffset,
    weekendBStartOffset,
  } = input;

  if (cycleMembers.length === 0) return [];

  // sortOrder 기준으로 정렬된 멤버 배열
  const members = [...cycleMembers].sort((a, b) => a.sortOrder - b.sortOrder);
  const N = members.length;

  // 각 풀의 현재 순번 카운터 (시작 오프셋 적용)
  let weekdayCounter = weekdayStartOffset % N;
  let weekendACounter = weekendAStartOffset % N;
  let weekendBCounter = weekendBStartOffset % N;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const assignments: AssignmentSlot[] = [];

  // 연속근무 방지를 위한 전날 배정 추적
  // key: "memberId:yyyy-MM-dd", value: 해당 날짜에 배정된 근무 유형 목록
  const prevDayAssignments = new Map<string, DutyType[]>();

  function recordAssignment(memberId: string, date: Date, dutyType: DutyType) {
    const key = `${memberId}:${format(date, "yyyy-MM-dd")}`;
    const existing = prevDayAssignments.get(key) ?? [];
    prevDayAssignments.set(key, [...existing, dutyType]);
  }

  for (const day of days) {
    const slots = getSlotsForDay(day, holidays);
    const assignedTodayIds = new Set<string>();

    for (const dutyType of slots) {
      const pool = getPool(day, dutyType);

      let counter: number;
      if (pool === "weekday") counter = weekdayCounter;
      else if (pool === "weekendA") counter = weekendACounter;
      else counter = weekendBCounter;

      // 현재 카운터부터 순회하며 배정 가능한 멤버 찾기
      let assigned = false;
      for (let attempt = 0; attempt < N; attempt++) {
        const idx = (counter + attempt) % N;
        const member = members[idx];

        if (assignedTodayIds.has(member.memberId)) continue;
        if (hasConsecutiveConflict(member.memberId, day, dutyType, prevDayAssignments)) continue;

        assignments.push({
          unitId,
          cycleId,
          memberId: member.memberId,
          date: startOfDay(day),
          dutyType,
        });

        recordAssignment(member.memberId, day, dutyType);
        assignedTodayIds.add(member.memberId);

        // 연속근무로 건너뛴 경우 counter를 다음으로 이동
        if (attempt > 0) {
          // 건너뛴 멤버만큼 counter 보정 (해당 멤버가 나중에 다시 앞에 올 수 있도록)
          counter = (counter + attempt) % N;
        }

        // 다음 슬롯을 위해 카운터 증가
        if (pool === "weekday") weekdayCounter = (counter + 1) % N;
        else if (pool === "weekendA") weekendACounter = (counter + 1) % N;
        else weekendBCounter = (counter + 1) % N;

        assigned = true;
        break;
      }

      // 모든 시도가 실패한 경우 (연속근무 회피 불가): 강제 배정
      if (!assigned) {
        const idx = counter % N;
        // 오늘 아직 배정 안 된 멤버 찾기
        for (let attempt = 0; attempt < N; attempt++) {
          const forcedIdx = (counter + attempt) % N;
          const member = members[forcedIdx];
          if (!assignedTodayIds.has(member.memberId)) {
            assignments.push({
              unitId,
              cycleId,
              memberId: member.memberId,
              date: startOfDay(day),
              dutyType,
            });
            recordAssignment(member.memberId, day, dutyType);
            assignedTodayIds.add(member.memberId);

            if (pool === "weekday") weekdayCounter = (forcedIdx + 1) % N;
            else if (pool === "weekendA") weekendACounter = (forcedIdx + 1) % N;
            else weekendBCounter = (forcedIdx + 1) % N;
            break;
          }
        }
        // 배정 불가 (멤버 수 부족)
        void idx;
      }
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
  existingCounts: Record<string, Record<DutyType, number>>,
  startOffset: number = 0
): AssignmentSlot[] {
  const members = [...cycleMembers].sort((a, b) => a.sortOrder - b.sortOrder);
  const N = members.length;
  const slots = [DutyType.WEEKEND_DAY, DutyType.WEEKEND_NIGHT];
  const assignments: AssignmentSlot[] = [];
  const assignedTodayIds = new Set<string>();

  let counter = startOffset % N;

  for (const dutyType of slots) {
    for (let attempt = 0; attempt < N; attempt++) {
      const idx = (counter + attempt) % N;
      const member = members[idx];
      if (!assignedTodayIds.has(member.memberId)) {
        assignments.push({
          unitId,
          cycleId,
          memberId: member.memberId,
          date: startOfDay(date),
          dutyType,
        });
        assignedTodayIds.add(member.memberId);
        counter = (idx + 1) % N;
        break;
      }
    }
    void existingCounts; // counts no longer used in new algorithm
  }

  return assignments;
}
