"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">알림</h1>
        <Button variant="ghost" size="sm" onClick={markAllRead}>
          모두 읽음
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">로딩 중...</p>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          알림이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl shadow-sm p-4 space-y-1 ${
                !n.isRead ? "border-l-4 border-green-500" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(n.createdAt), "M/d HH:mm", { locale: ko })}
                </span>
              </div>
              <p className="text-sm text-gray-600">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
