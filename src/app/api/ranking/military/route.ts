import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RawMilitaryRow {
  memberId: string;
  nickname: string;
  level: number;
  workoutStyle: string[];
  photoUrl: string | null;
  runTime: number;
  pushups: number;
  situps: number;
  grade: string;
  gradeScore: number;
  recordedAt: Date;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unitCode = searchParams.get("unitCode");
  const sort = searchParams.get("sort") || "grade";

  if (!unitCode) return NextResponse.json({ error: "unitCode 필요" }, { status: 400 });

  try {
    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) return NextResponse.json({ error: "존재하지 않는 부대" }, { status: 404 });

    const rows = await prisma.$queryRaw<RawMilitaryRow[]>`
      SELECT DISTINCT ON (m.id)
        m.id as "memberId",
        m.nickname,
        m.level,
        m."workoutStyle",
        m."photoUrl",
        r."runTime",
        r.pushups,
        r.situps,
        r.grade,
        r."gradeScore",
        r."recordedAt"
      FROM "Member" m
      JOIN "MilitaryRecord" r ON r."memberId" = m.id
      WHERE m."unitId" = ${unit.id}
      ORDER BY m.id, r."recordedAt" DESC
    `;

    if (sort === "run") {
      rows.sort((a, b) => a.runTime - b.runTime); // 빠를수록 좋음
    } else if (sort === "pushup") {
      rows.sort((a, b) => b.pushups - a.pushups);
    } else if (sort === "situp") {
      rows.sort((a, b) => b.situps - a.situps);
    } else {
      // grade (gradeScore DESC, runTime ASC)
      rows.sort((a, b) => {
        if (b.gradeScore !== a.gradeScore) return b.gradeScore - a.gradeScore;
        return a.runTime - b.runTime;
      });
    }

    const result = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
