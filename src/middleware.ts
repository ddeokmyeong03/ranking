import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
];

const ADMIN_PATHS = ["/admin", "/api/cycles", "/api/holidays", "/api/allowance-rates", "/api/units", "/api/members"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;

  // Check for trusted device auto-login
  if (!token) {
    const deviceToken = req.cookies.get("device_token")?.value;
    if (deviceToken) {
      // Redirect to auto-login handler
      // The actual auto-login is handled in the login page
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    return res;
  }

  // Admin-only paths
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (session.role !== "UNIT_ADMIN") {
      // For API routes, return 403
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Inject session info into headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-member-id", session.memberId);
  requestHeaders.set("x-unit-id", session.unitId);
  requestHeaders.set("x-unit-code", session.unitCode);
  requestHeaders.set("x-member-role", session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
