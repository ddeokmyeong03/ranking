import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { getPowerliftingScore, getMilitaryGrade } from "@/lib/scoring";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      unitCode,
      nickname,
      password,
      height,
      weight,
      level,
      workoutStyle,
      photoUrl,
      recordType,
      // powerlifting
      benchPress,
      deadlift,
      squat,
      // military
      runTime,
      pushups,
      situps,
      // inbody
      muscleMass,
      bodyFatPct,
    } = body;

    if (!unitCode || !nickname?.trim() || !password) {
      return NextResponse.json({ error: "필수 정보를 입력해주세요" }, { status: 400 });
    }

    const unit = await prisma.unit.findUnique({ where: { code: unitCode.toUpperCase() } });
    if (!unit) {
      return NextResponse.json({ error: "존재하지 않는 부대 코드입니다" }, { status: 404 });
    }

    const existing = await prisma.member.findUnique({
      where: { unitId_nickname: { unitId: unit.id, nickname: nickname.trim() } },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 닉네임입니다" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const member = await prisma.member.create({
      data: {
        unitId: unit.id,
        nickname: nickname.trim(),
        passwordHash,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        level: Number(level) || 1,
        workoutStyle: workoutStyle || [],
        photoUrl: photoUrl || null,
      },
    });

    // 초기 기록 저장
    if (recordType === "powerlifting" && benchPress && deadlift && squat) {
      const total = Number(benchPress) + Number(deadlift) + Number(squat);
      const score = getPowerliftingScore(total);
      await prisma.powerliftingRecord.create({
        data: {
          memberId: member.id,
          benchPress: Number(benchPress),
          deadlift: Number(deadlift),
          squat: Number(squat),
          total,
          score,
        },
      });
      // 첫 기록 업적
      await unlockAchievement(member.id, "FIRST_RECORD");
    } else if (recordType === "military" && runTime && pushups && situps) {
      const { grade, gradeScore } = getMilitaryGrade(Number(runTime), Number(pushups), Number(situps));
      await prisma.militaryRecord.create({
        data: {
          memberId: member.id,
          runTime: Number(runTime),
          pushups: Number(pushups),
          situps: Number(situps),
          grade,
          gradeScore,
        },
      });
      await unlockAchievement(member.id, "FIRST_RECORD");
      if (grade === "특급") await unlockAchievement(member.id, "MILITARY_특급");
    } else if (recordType === "inbody" && muscleMass && bodyFatPct && weight) {
      await prisma.inbodyRecord.create({
        data: {
          memberId: member.id,
          muscleMass: Number(muscleMass),
          bodyFatPct: Number(bodyFatPct),
          weight: Number(weight),
          weightChangePct: 0,
        },
      });
      await unlockAchievement(member.id, "FIRST_INBODY");
    }

    const token = await signToken({
      memberId: member.id,
      unitId: unit.id,
      nickname: member.nickname,
      unitCode: unit.code,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ memberId: member.id, nickname: member.nickname });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

async function unlockAchievement(memberId: string, key: string) {
  try {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return;
    await prisma.memberAchievement.create({
      data: { memberId, achievementId: achievement.id },
    });
  } catch {
    // already exists - ignore
  }
}
