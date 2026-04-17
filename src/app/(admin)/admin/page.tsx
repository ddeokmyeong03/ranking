import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, RefreshCcw, Calendar, Umbrella, Wallet, UserCheck } from "lucide-react";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await verifySession(token);
  if (!session || session.role !== "UNIT_ADMIN") redirect("/dashboard");

  const today = new Date();

  const [memberCount, activeCycle, openListings] = await Promise.all([
    prisma.member.count({ where: { unitId: session.unitId, isActive: true } }),
    // 오늘 날짜가 startDate ~ endDate 사이에 있는 사이클을 활성으로 판단
    prisma.dutyCycle.findFirst({
      where: {
        unitId: session.unitId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dutyChangeListing.count({
      where: { assignment: { unitId: session.unitId }, status: "OPEN" },
    }),
  ]);

  const unit = await prisma.unit.findUnique({ where: { id: session.unitId } });

  const navItems = [
    { href: "/admin/members", icon: Users, label: "간부 관리", desc: "간부 목록, 역할 설정" },
    { href: "/admin/cycles", icon: RefreshCcw, label: "사이클 관리", desc: "당직 사이클 생성·수정·편성" },
    { href: "/admin/schedule", icon: Calendar, label: "근무표", desc: "월별 전체 근무 현황" },
    { href: "/admin/holidays", icon: Umbrella, label: "공휴일 등록", desc: "공휴일 / 전투휴무 지정" },
    { href: "/admin/allowances", icon: Wallet, label: "수당 요율", desc: "근무 유형별 수당 설정" },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">관리자 모드</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">
          {unit?.name} · 부대코드: <span className="font-mono font-bold">{unit?.code}</span>
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
          <p className="text-xs text-gray-500 mt-1">활성 간부</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          {activeCycle ? (
            <>
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="text-xs font-bold text-green-700">편성중</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{activeCycle.name}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-500 mt-1">활성 사이클 없음</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{openListings}</p>
          <p className="text-xs text-gray-500 mt-1">변경 희망</p>
        </div>
      </div>

      {/* 메뉴 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {navItems.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon size={16} className="text-gray-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
            </div>
            <p className="text-xs text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      {/* 사용자 페이지 이동 */}
      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-medium transition-colors"
      >
        <UserCheck size={16} />
        사용자 페이지로 이동
      </Link>
    </div>
  );
}
