import Link from "next/link";
import { Users, RefreshCcw, Calendar, Umbrella, Wallet, LayoutDashboard } from "lucide-react";

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, label: "대시보드" },
  { href: "/admin/members", icon: Users, label: "간부 관리" },
  { href: "/admin/cycles", icon: RefreshCcw, label: "사이클 관리" },
  { href: "/admin/schedule", icon: Calendar, label: "근무표" },
  { href: "/admin/holidays", icon: Umbrella, label: "공휴일/전투휴무" },
  { href: "/admin/allowances", icon: Wallet, label: "수당 요율" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 text-white">
        <div className="px-5 py-6 border-b border-gray-700">
          <p className="font-bold text-sm">🔐 관리자 모드</p>
          <p className="text-xs text-gray-400 mt-1">당직근무 관리 시스템</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              사용자 화면 →
            </Link>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between md:hidden">
          <span className="font-bold text-sm">🔐 관리자 모드</span>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
