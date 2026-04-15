import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, isAfter, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { dutyTypeLabel, dutyTypeColor } from "@/lib/utils";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await verifySession(token);
  if (!session) redirect("/login");

  const today = startOfDay(new Date());
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [member, upcomingAssignments, thisMonthAssignments, openListingsCount] =
    await Promise.all([
      prisma.member.findUnique({
        where: { id: session.memberId },
        include: { unit: { select: { name: true } } },
      }),
      prisma.dutyAssignment.findMany({
        where: {
          memberId: session.memberId,
          date: { gte: today },
        },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.dutyAssignment.findMany({
        where: {
          memberId: session.memberId,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.dutyChangeListing.count({
        where: {
          assignment: { unitId: session.unitId },
          status: "OPEN",
        },
      }),
    ]);

  if (!member) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white">
        <p className="text-green-100 text-sm">안녕하세요,</p>
        <h1 className="text-2xl font-bold mt-1">
          {member.rank} {member.name}님
        </h1>
        <p className="text-green-100 text-sm mt-1">{member.unit.name}</p>
      </div>

      {/* Upcoming duties */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">다가오는 당직</h2>
        {upcomingAssignments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">예정된 당직이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {upcomingAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-800">
                  {format(a.date, "M월 d일 (eee)", { locale: ko })}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${dutyTypeColor(a.dutyType)}`}
                >
                  {dutyTypeLabel(a.dutyType)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* This month stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-700">{thisMonthAssignments.length}</p>
          <p className="text-sm text-gray-500 mt-1">이달 당직 횟수</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-orange-500">{openListingsCount}</p>
          <p className="text-sm text-gray-500 mt-1">변경 희망 게시글</p>
        </div>
      </div>

      {/* Quick links */}
      {session.role === "UNIT_ADMIN" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800">관리자 메뉴</p>
          <a
            href="/admin"
            className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-900"
          >
            관리자 대시보드 →
          </a>
        </div>
      )}
    </div>
  );
}
