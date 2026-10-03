-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('LEAD', 'ACTIVE', 'PAUSED', 'CHURNED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'EBOOK', 'COURSE', 'SERVICE', 'PROGRAM', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneE164" TEXT,
    "displayName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "country" VARCHAR(2),
    "timezone" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellnessProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "primaryGoal" TEXT,
    "routineSummary" TEXT,
    "movementLevel" TEXT,
    "sleepPattern" TEXT,
    "foodPreferences" JSONB,
    "barriers" JSONB,
    "communicationPrefs" JSONB,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellnessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramVersion" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramEnrollment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programVersionId" TEXT,
    "status" "ProgramEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "currentDay" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "energy" INTEGER,
    "sleep" INTEGER,
    "movement" INTEGER,
    "hydration" INTEGER,
    "wellbeing" INTEGER,
    "note" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "status" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "provider" TEXT,
    "externalId" TEXT,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStart" TIMESTAMP(3),
    "currentEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_phoneE164_key" ON "Member"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "WellnessProfile_memberId_key" ON "WellnessProfile"("memberId");

-- CreateIndex
CREATE INDEX "Consent_memberId_type_idx" ON "Consent"("memberId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramVersion_programId_version_locale_key" ON "ProgramVersion"("programId", "version", "locale");

-- CreateIndex
CREATE INDEX "ProgramEnrollment_memberId_status_idx" ON "ProgramEnrollment"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_memberId_localDate_key" ON "DailyCheckin"("memberId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_externalId_key" ON "Subscription"("externalId");

-- CreateIndex
CREATE INDEX "AuditEvent_resource_resourceId_idx" ON "AuditEvent"("resource", "resourceId");

-- AddForeignKey
ALTER TABLE "WellnessProfile" ADD CONSTRAINT "WellnessProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramVersion" ADD CONSTRAINT "ProgramVersion_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

