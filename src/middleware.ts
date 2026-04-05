import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 로그인 없이도 볼 수 있는 페이지: 랭킹, 특급전사, 인바디, 부대전, 도발, 명예의 전당
// 내 기록 페이지는 클라이언트에서 처리 (로그인 유도)
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /unit/[code]/register 는 미인증도 OK
  if (pathname.includes("/register")) return NextResponse.next();

  // API 라우트는 각자 처리
  if (pathname.startsWith("/api")) return NextResponse.next();

  return NextResponse.next();
}

export const config = {
  matcher: ["/unit/:code*"],
};
