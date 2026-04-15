-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('UNIT_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC_HOLIDAY', 'COMBAT_REST');

-- CreateEnum
CREATE TYPE "DutyType" AS ENUM ('WEEKDAY', 'WEEKEND_DAY', 'WEEKEND_NIGHT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DUTY_SCHEDULE_PUBLISHED', 'LISTING_NEW', 'LISTING_OFFER_RECEIVED', 'LISTING_OFFER_APPROVED', 'LISTING_OFFER_REJECTED', 'REQUEST_RECEIVED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'SWAP_COMPLETED');

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "militaryId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "position" TEXT,
    "commissionDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "role" "MemberRole" NOT NULL DEFAULT 'USER',
    "unitId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyCycle" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyCycleMember" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DutyCycleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitHoliday" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "HolidayType" NOT NULL,
    "name" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyAssignment" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "cycleId" TEXT,
    "memberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dutyType" "DutyType" NOT NULL,
    "isSwapped" BOOLEAN NOT NULL DEFAULT false,
    "originalMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyChangeListing" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyChangeListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyChangeOffer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "offererId" TEXT NOT NULL,
    "offererAssignmentId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyChangeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyChangeRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterAssignmentId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "targetAssignmentId" TEXT NOT NULL,
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllowanceRate" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "dutyType" "DutyType" NOT NULL,
    "amountKRW" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowanceRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Member_militaryId_key" ON "Member"("militaryId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_deviceToken_key" ON "TrustedDevice"("deviceToken");

-- CreateIndex
CREATE INDEX "TrustedDevice_memberId_idx" ON "TrustedDevice"("memberId");

-- CreateIndex
CREATE INDEX "DutyCycleMember_cycleId_sortOrder_idx" ON "DutyCycleMember"("cycleId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DutyCycleMember_cycleId_memberId_key" ON "DutyCycleMember"("cycleId", "memberId");

-- CreateIndex
CREATE INDEX "UnitHoliday_unitId_date_idx" ON "UnitHoliday"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UnitHoliday_unitId_date_key" ON "UnitHoliday"("unitId", "date");

-- CreateIndex
CREATE INDEX "DutyAssignment_memberId_idx" ON "DutyAssignment"("memberId");

-- CreateIndex
CREATE INDEX "DutyAssignment_unitId_date_idx" ON "DutyAssignment"("unitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DutyAssignment_unitId_date_dutyType_key" ON "DutyAssignment"("unitId", "date", "dutyType");

-- CreateIndex
CREATE INDEX "AllowanceRate_unitId_dutyType_effectiveFrom_idx" ON "AllowanceRate"("unitId", "dutyType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_createdAt_idx" ON "Notification"("recipientId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyCycle" ADD CONSTRAINT "DutyCycle_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyCycleMember" ADD CONSTRAINT "DutyCycleMember_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "DutyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyCycleMember" ADD CONSTRAINT "DutyCycleMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitHoliday" ADD CONSTRAINT "UnitHoliday_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "DutyCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyAssignment" ADD CONSTRAINT "DutyAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeListing" ADD CONSTRAINT "DutyChangeListing_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DutyAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeListing" ADD CONSTRAINT "DutyChangeListing_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeOffer" ADD CONSTRAINT "DutyChangeOffer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "DutyChangeListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeOffer" ADD CONSTRAINT "DutyChangeOffer_offererId_fkey" FOREIGN KEY ("offererId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeRequest" ADD CONSTRAINT "DutyChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeRequest" ADD CONSTRAINT "DutyChangeRequest_requesterAssignmentId_fkey" FOREIGN KEY ("requesterAssignmentId") REFERENCES "DutyAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeRequest" ADD CONSTRAINT "DutyChangeRequest_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyChangeRequest" ADD CONSTRAINT "DutyChangeRequest_targetAssignmentId_fkey" FOREIGN KEY ("targetAssignmentId") REFERENCES "DutyAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllowanceRate" ADD CONSTRAINT "AllowanceRate_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
