"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Flag, Flame, User, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  unitCode: string;
}

export default function BottomNav({ unitCode }: BottomNavProps) {
  const pathname = usePathname();
  const base = `/unit/${unitCode}`;

  const tabs = [
    { href: `${base}/ranking`, label: "랭킹", Icon: Trophy },
    { href: `${base}/battle`, label: "부대전", Icon: Flag },
    { href: `${base}/provocation`, label: "도발", Icon: Flame },
    { href: `${base}/profile`, label: "내기록", Icon: User },
    { href: `${base}/hall`, label: "기록", Icon: Skull },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center py-3 gap-1 transition-colors",
                active ? "text-gold" : "text-gray-500"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
