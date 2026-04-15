import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a test unit
  const unit = await prisma.unit.upsert({
    where: { code: "TEST01" },
    update: {},
    create: {
      name: "1사단 1연대 2대대",
      code: "TEST01",
    },
  });

  console.log("✅ Unit created:", unit.name, "code:", unit.code);

  // Create admin member
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.member.upsert({
    where: { militaryId: "22-00000001" },
    update: {},
    create: {
      militaryId: "22-00000001",
      passwordHash: adminHash,
      name: "김관리",
      rank: "중위",
      position: "작전장교",
      role: "UNIT_ADMIN",
      unitId: unit.id,
    },
  });

  console.log("✅ Admin created:", admin.rank, admin.name, "/ militaryId:", admin.militaryId);

  // Create sample members
  const memberData = [
    { militaryId: "22-00000002", name: "이준호", rank: "소위" },
    { militaryId: "22-00000003", name: "박지수", rank: "중사" },
    { militaryId: "22-00000004", name: "최민준", rank: "하사" },
    { militaryId: "22-00000005", name: "정서연", rank: "상사" },
  ];

  for (const m of memberData) {
    const hash = await bcrypt.hash("password1234", 12);
    await prisma.member.upsert({
      where: { militaryId: m.militaryId },
      update: {},
      create: {
        ...m,
        passwordHash: hash,
        unitId: unit.id,
      },
    });
    console.log("✅ Member created:", m.rank, m.name);
  }

  // Create allowance rates
  await prisma.allowanceRate.createMany({
    data: [
      {
        unitId: unit.id,
        dutyType: "WEEKDAY",
        amountKRW: 40000,
        effectiveFrom: new Date("2025-01-01"),
      },
      {
        unitId: unit.id,
        dutyType: "WEEKEND_DAY",
        amountKRW: 60000,
        effectiveFrom: new Date("2025-01-01"),
      },
      {
        unitId: unit.id,
        dutyType: "WEEKEND_NIGHT",
        amountKRW: 80000,
        effectiveFrom: new Date("2025-01-01"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Allowance rates created");
  console.log("\n📋 Login info:");
  console.log("  Admin   - militaryId: 22-00000001, password: admin1234, unitCode: TEST01");
  console.log("  Members - militaryId: 22-0000000X (X=2~5), password: password1234, unitCode: TEST01");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
