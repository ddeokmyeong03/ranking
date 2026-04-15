import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const deviceToken = nanoid(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.trustedDevice.create({
    data: {
      memberId: session.memberId,
      deviceToken,
      userAgent,
      expiresAt,
    },
  });

  const res = NextResponse.json({ message: "기기가 등록되었습니다." });
  res.cookies.set("device_token", deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return res;
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceToken = req.cookies.get("device_token")?.value;
  if (deviceToken) {
    await prisma.trustedDevice.deleteMany({
      where: { deviceToken, memberId: session.memberId },
    });
  }

  const res = NextResponse.json({ message: "기기 등록이 해제되었습니다." });
  res.cookies.delete("device_token");
  return res;
}
