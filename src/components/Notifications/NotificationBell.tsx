"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "init" || data.type === "unread") {
        setUnreadCount(data.count ?? data.unreadCount ?? 0);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Fallback: fetch unread count
      fetch("/api/notifications?page=1")
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.unreadCount ?? 0))
        .catch(() => {});
    };

    return () => eventSource.close();
  }, []);

  return (
    <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900">
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
