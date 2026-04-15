import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "duty-schedule-secret-key-change-in-production"
);

const TEMP_SECRET = new TextEncoder().encode(
  process.env.TEMP_SESSION_SECRET ?? "temp-duty-secret-key-change-in-production"
);

export interface SessionPayload {
  memberId: string;
  unitId: string;
  unitCode: string;
  role: "UNIT_ADMIN" | "USER";
}

export interface TempSessionPayload {
  memberId: string;
  militaryId: string;
}

// =============================================
// Full session (7 days)
// =============================================

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// =============================================
// Temp session (15 minutes, step-1 login)
// =============================================

export async function createTempSession(
  payload: TempSessionPayload
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(TEMP_SECRET);
}

export async function verifyTempSession(
  token: string
): Promise<TempSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, TEMP_SECRET);
    return payload as unknown as TempSessionPayload;
  } catch {
    return null;
  }
}

// =============================================
// Cookie helpers (server components / route handlers)
// =============================================

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function setTempSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("temp_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("temp_session");
}

// =============================================
// Auth helpers for route handlers
// =============================================

export async function getSession(
  req?: NextRequest
): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get("session")?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("session")?.value;
  }

  if (!token) return null;
  return verifySession(token);
}

export async function getTempSession(
  req?: NextRequest
): Promise<TempSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get("temp_session")?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("temp_session")?.value;
  }

  if (!token) return null;
  return verifyTempSession(token);
}

export async function requireSession(
  req?: NextRequest
): Promise<SessionPayload> {
  const session = await getSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(req?: NextRequest): Promise<SessionPayload> {
  const session = await requireSession(req);
  if (session.role !== "UNIT_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

// =============================================
// Trusted device token (auto-login)
// =============================================

export function setTrustedDeviceCookie(res: Response, token: string) {
  // Called from route handlers that return Response
  res.headers.append(
    "Set-Cookie",
    `device_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}`
  );
}
