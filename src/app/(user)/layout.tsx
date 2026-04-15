import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { BottomNav } from "@/components/BottomNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span>🎖️</span> 당직근무 관리
        </span>
        <NotificationBell />
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-2xl w-full mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
