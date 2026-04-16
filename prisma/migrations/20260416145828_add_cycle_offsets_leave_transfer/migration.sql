-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'DAY_OFF');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_BLOCKED_LEAVE';

-- AlterTable
ALTER TABLE "DutyCycle" ADD COLUMN     "weekdayStartOffset" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekendAStartOffset" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekendBStartOffset" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "transferOrderDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MemberLeave" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberLeave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberLeave_memberId_startDate_endDate_idx" ON "MemberLeave"("memberId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "MemberLeave" ADD CONSTRAINT "MemberLeave_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
