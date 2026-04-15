import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const memberId = session.memberId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(data: object) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      // Send initial unread count
      const unreadCount = await prisma.notification.count({
        where: { recipientId: memberId, isRead: false },
      });
      send({ type: "init", unreadCount });

      // Poll for new notifications every 15 seconds
      const interval = setInterval(async () => {
        try {
          const unread = await prisma.notification.count({
            where: { recipientId: memberId, isRead: false },
          });
          send({ type: "unread", count: unread });
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 15000);

      // Close on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
