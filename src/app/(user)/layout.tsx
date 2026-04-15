import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  List,
  ArrowLeftRight,
  Wallet,
  User,
} from "lucide-react";
import { NotificationBell } from "@/components/Notifications/NotificationBell";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "홈" },
  { href: "/schedule", icon: Calendar, label: "근무표" },
  { href: "/listings", icon: List, label: "변경 희망" },
  { href: "/requests", icon: ArrowLeftRight, label: "요청" },
  { href: "/allowance", icon: Wallet, label: "수당" },
  { href: "/profile", icon: User, label: "프로필" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r shadow-sm">
        <div className="px-5 py-6 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎖️</span>
            <div>
              <p className="font-bold text-gray-900 text-sm">당직근무 관리</p>
              <p className="text-xs text-gray-400">육군 간부 전용</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between md:justify-end">
          <span className="md:hidden font-bold text-gray-900 text-sm flex items-center gap-2">
            <span>🎖️</span> 당직근무 관리
          </span>
          <NotificationBell />
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-4xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-2 text-gray-500 hover:text-green-700 text-xs gap-1"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
