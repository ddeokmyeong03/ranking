"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ArrowLeftRight, LayoutDashboard, Wallet, User } from "lucide-react";

const navItems = [
  { href: "/listings", icon: List, label: "변경희망" },
  { href: "/requests", icon: ArrowLeftRight, label: "요청" },
  { href: "/dashboard", icon: LayoutDashboard, label: "홈", home: true },
  { href: "/allowance", icon: Wallet, label: "수당" },
  { href: "/profile", icon: User, label: "프로필" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex">
      {navItems.map(({ href, icon: Icon, label, home }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              home
                ? isActive
                  ? "text-white"
                  : "text-green-700"
                : isActive
                ? "text-green-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {home ? (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg border-2 border-white transition-colors ${
                  isActive ? "bg-green-700" : "bg-green-600"
                }`}
              >
                <Icon size={22} className="text-white" />
              </div>
            ) : (
              <Icon size={22} />
            )}
            <span className={home ? "mt-0.5" : ""}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
