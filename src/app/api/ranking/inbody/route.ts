import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RawInbodyRow {
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  muscleMass: number;
  bodyFatPct: number;
  weight: number;
  weightChangePct: number;
  recordedAt: Date;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unitCode = searchParams.get("unitCode");
  const sort = searchParams.get("sort") || "muscle";

  if (!unitCode) return NextResponse.json({ error: "unitCode 필요" }, { status: 400 });

  try {
    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) return NextResponse.json({ error: "존재하지 않는 부대" }, { status: 404 });

    const rows = await prisma.$queryRaw<RawInbodyRow[]>`
      SELECT DISTINCT ON (m.id)
        m.id as "memberId",
        m.nickname,
        m.level,
        m."workoutStyle",
        m."photoUrl",
        r."muscleMass",
        r."bodyFatPct",
        r.weight,
        r."weightChangePct",
        r."recordedAt"
      FROM "Member" m
      JOIN "InbodyRecord" r ON r."memberId" = m.id
      WHERE m."unitId" = ${unit.id}
      ORDER BY m.id, r."recordedAt" DESC
    `;

    if (sort === "fat") {
      rows.sort((a, b) => a.bodyFatPct - b.bodyFatPct); // 낮을수록 좋음
    } else if (sort === "change") {
      rows.sort((a, b) => a.weightChangePct - b.weightChangePct); // 감량 많을수록 좋음 (음수가 클수록)
    } else {
      rows.sort((a, b) => b.muscleMass - a.muscleMass); // 높을수록 좋음
    }

    const result = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
