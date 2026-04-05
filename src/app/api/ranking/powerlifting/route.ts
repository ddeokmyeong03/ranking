import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RawPowerRow {
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  benchPress: number;
  deadlift: number;
  squat: number;
  total: number;
  score: number;
  recordedAt: Date;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unitCode = searchParams.get("unitCode");
  const filter = searchParams.get("filter") || "total";
  const levelFilter = searchParams.get("level");
  const styleFilter = searchParams.get("style");

  if (!unitCode) return NextResponse.json({ error: "unitCode 필요" }, { status: 400 });

  try {
    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) return NextResponse.json({ error: "존재하지 않는 부대" }, { status: 404 });

    // 각 멤버의 최신 기록 1개씩
    const rows = await prisma.$queryRaw<RawPowerRow[]>`
      SELECT DISTINCT ON (m.id)
        m.id as "memberId",
        m.nickname,
        m.level,
        m."workoutStyle",
        m."photoUrl",
        r."benchPress",
        r.deadlift,
        r.squat,
        r.total,
        r.score,
        r."recordedAt"
      FROM "Member" m
      JOIN "PowerliftingRecord" r ON r."memberId" = m.id
      WHERE m."unitId" = ${unit.id}
      ORDER BY m.id, r."recordedAt" DESC
    `;

    let filtered = rows;

    if (levelFilter) {
      filtered = filtered.filter((r) => r.level === Number(levelFilter));
    }
    if (styleFilter) {
      filtered = filtered.filter((r) => r.workoutStyle.includes(styleFilter));
    }

    if (filter === "growth") {
      // 상승률: 최신 total vs 이전 total
      const withGrowth = await Promise.all(
        filtered.map(async (r) => {
          const prev = await prisma.powerliftingRecord.findFirst({
            where: {
              memberId: r.memberId,
              recordedAt: { lt: r.recordedAt },
            },
            orderBy: { recordedAt: "desc" },
          });
          const growthPct = prev ? ((r.total - prev.total) / prev.total) * 100 : null;
          return { ...r, growthPct };
        })
      );
      withGrowth.sort((a, b) => (b.growthPct ?? -Infinity) - (a.growthPct ?? -Infinity));
      const result = withGrowth.map((r, i) => ({ ...r, rank: i + 1 }));
      return NextResponse.json(result);
    }

    if (filter === "attendance") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const withAttendance = await Promise.all(
        filtered.map(async (r) => {
          const streak = await getStreak(r.memberId);
          const todayAttended = await prisma.attendance.findUnique({
            where: {
              memberId_date: {
                memberId: r.memberId,
                date: today,
              },
            },
          });
          return { ...r, streak, todayAttended: !!todayAttended };
        })
      );
      withAttendance.sort((a, b) => b.streak - a.streak);
      return NextResponse.json(withAttendance.map((r, i) => ({ ...r, rank: i + 1 })));
    }

    // default: total 내림차순
    filtered.sort((a, b) => b.total - a.total);
    const result = filtered.map((r, i) => ({ ...r, rank: i + 1 }));
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

async function getStreak(memberId: string): Promise<number> {
  const records = await prisma.attendance.findMany({
    where: { memberId },
    orderBy: { date: "desc" },
    take: 365,
  });

  if (records.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = today.getTime();

  for (const r of records) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      cursor = d.getTime();
    } else {
      break;
    }
  }
  return streak;
}
