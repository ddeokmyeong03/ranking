import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await verifySession(token);
  if (!session || session.role !== "UNIT_ADMIN") redirect("/dashboard");

  const [memberCount, activeCycle, openListings] = await Promise.all([
    prisma.member.count({ where: { unitId: session.unitId, isActive: true } }),
    prisma.dutyCycle.findFirst({
      where: { unitId: session.unitId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dutyChangeListing.count({
      where: { assignment: { unitId: session.unitId }, status: "OPEN" },
    }),
  ]);

  const unit = await prisma.unit.findUnique({ where: { id: session.unitId } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">
          {unit?.name} · 부대코드: <span className="font-mono font-bold">{unit?.code}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{memberCount}</p>
          <p className="text-sm text-gray-500 mt-1">활성 간부</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-700">{activeCycle ? "O" : "✗"}</p>
          <p className="text-sm text-gray-500 mt-1">활성 사이클</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-orange-500">{openListings}</p>
          <p className="text-sm text-gray-500 mt-1">변경 희망 게시글</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { href: "/admin/members", label: "간부 관리", desc: "간부 목록, 역할 설정" },
          { href: "/admin/cycles/new", label: "사이클 생성", desc: "새 당직 사이클 편성" },
          { href: "/admin/holidays", label: "공휴일 등록", desc: "공휴일/전투휴무 지정" },
          { href: "/admin/allowances", label: "수당 요율", desc: "근무 유형별 수당 설정" },
        ].map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
