import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { calculateAllowance } from "@/lib/allowance";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { searchParams } = new URL(req.url);

    const memberId = searchParams.get("memberId") ?? session.memberId;
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

    const result = await calculateAllowance(memberId, year, month);
    return NextResponse.json({ ...result, year, month });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
