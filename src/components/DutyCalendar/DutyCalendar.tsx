"use client";

import { DutyAssignment, DutyType, HolidayType, Member } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  format,
  isSameDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { dutyTypeLabel } from "@/lib/utils";

type AssignmentWithMember = DutyAssignment & {
  member: Pick<Member, "id" | "name" | "rank">;
};

interface Holiday {
  date: Date;
  type: HolidayType;
  name?: string | null;
}

interface ListingDate {
  date: Date;
}

interface DutyCalendarProps {
  year: number;
  month: number;
  assignments: AssignmentWithMember[];
  holidays: Holiday[];
  listingDates?: ListingDate[];
  currentMemberId?: string;
}

const DUTY_COLORS: Record<DutyType, string> = {
  WEEKDAY: "bg-blue-50 text-blue-700 border-l-2 border-blue-400",
  WEEKEND_DAY: "bg-green-50 text-green-700 border-l-2 border-green-400",
  WEEKEND_NIGHT: "bg-purple-50 text-purple-700 border-l-2 border-purple-400",
};

const MY_DUTY_COLORS: Record<DutyType, string> = {
  WEEKDAY: "bg-blue-500 text-white border-l-2 border-blue-700",
  WEEKEND_DAY: "bg-green-500 text-white border-l-2 border-green-700",
  WEEKEND_NIGHT: "bg-purple-500 text-white border-l-2 border-purple-700",
};

export function DutyCalendar({
  year,
  month,
  assignments,
  holidays,
  listingDates = [],
  currentMemberId,
}: DutyCalendarProps) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isHoliday = (date: Date) =>
    holidays.some((h) => isSameDay(h.date, date));

  const hasListing = (date: Date) =>
    listingDates.some((l) => isSameDay(l.date, date));

  const getAssignments = (date: Date) =>
    assignments.filter((a) => isSameDay(a.date, date));

  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Month header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {year}년 {month}월
        </h2>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayAssignments = getAssignments(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const holiday = isHoliday(day);
          const listing = hasListing(day);
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <div
              key={idx}
              className={`min-h-[90px] p-1.5 border-b border-r ${
                !isCurrentMonth ? "bg-gray-50" : "bg-white"
              } ${holiday ? "bg-yellow-50" : ""}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium ${
                    !isCurrentMonth
                      ? "text-gray-300"
                      : dayOfWeek === 0
                      ? "text-red-500"
                      : dayOfWeek === 6
                      ? "text-blue-500"
                      : holiday
                      ? "text-orange-500"
                      : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {listing && (
                  <span className="w-2 h-2 bg-orange-400 rounded-full" title="변경 희망 등록됨" />
                )}
              </div>

              {/* Assignments */}
              <div className="space-y-0.5">
                {dayAssignments.map((a) => {
                  const isMe = a.memberId === currentMemberId;
                  const colorClass = isMe ? MY_DUTY_COLORS[a.dutyType] : DUTY_COLORS[a.dutyType];
                  return (
                    <div
                      key={a.id}
                      className={`px-1 py-0.5 rounded text-xs truncate ${colorClass}`}
                      title={`${dutyTypeLabel(a.dutyType)}: ${a.member.rank} ${a.member.name}`}
                    >
                      {a.member.rank} {a.member.name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t bg-gray-50 flex flex-wrap gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-400 rounded" /> 평일 당직
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-400 rounded" /> 주말 주간
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-400 rounded" /> 주말 야간
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-400 rounded-full" /> 변경 희망
        </span>
      </div>
    </div>
  );
}
