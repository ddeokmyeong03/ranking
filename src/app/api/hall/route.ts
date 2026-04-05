import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unitCode = searchParams.get("unitCode");
  const category = searchParams.get("category") || "powerlifting";

  if (!unitCode) return NextResponse.json({ error: "unitCode 필요" }, { status: 400 });

  try {
    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) return NextResponse.json({ error: "존재하지 않는 부대" }, { status: 404 });

    if (category === "powerlifting") {
      const rows = await prisma.$queryRaw<{
        memberId: string; nickname: string; level: number;
        benchPress: number; deadlift: number; squat: number; total: number;
      }[]>`
        SELECT DISTINCT ON (m.id)
          m.id as "memberId", m.nickname, m.level,
          r."benchPress", r.deadlift, r.squat, r.total
        FROM "Member" m
        JOIN "PowerliftingRecord" r ON r."memberId" = m.id
        WHERE m."unitId" = ${unit.id}
        ORDER BY m.id, r."recordedAt" DESC
      `;
      rows.sort((a, b) => b.total - a.total);
      return NextResponse.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    }

    if (category === "military") {
      const rows = await prisma.$queryRaw<{
        memberId: string; nickname: string; level: number;
        runTime: number; pushups: number; situps: number; grade: string; gradeScore: number;
      }[]>`
        SELECT DISTINCT ON (m.id)
          m.id as "memberId", m.nickname, m.level,
          r."runTime", r.pushups, r.situps, r.grade, r."gradeScore"
        FROM "Member" m
        JOIN "MilitaryRecord" r ON r."memberId" = m.id
        WHERE m."unitId" = ${unit.id}
        ORDER BY m.id, r."recordedAt" DESC
      `;
      rows.sort((a, b) => b.gradeScore - a.gradeScore || a.runTime - b.runTime);
      return NextResponse.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    }

    if (category === "inbody") {
      const rows = await prisma.$queryRaw<{
        memberId: string; nickname: string; level: number;
        muscleMass: number; bodyFatPct: number; weight: number;
      }[]>`
        SELECT DISTINCT ON (m.id)
          m.id as "memberId", m.nickname, m.level,
          r."muscleMass", r."bodyFatPct", r.weight
        FROM "Member" m
        JOIN "InbodyRecord" r ON r."memberId" = m.id
        WHERE m."unitId" = ${unit.id}
        ORDER BY m.id, r."recordedAt" DESC
      `;
      rows.sort((a, b) => b.muscleMass - a.muscleMass);
      return NextResponse.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    }

    return NextResponse.json([]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
