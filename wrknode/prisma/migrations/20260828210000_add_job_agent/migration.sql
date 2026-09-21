-- CreateEnum
CREATE TYPE "JobLeadStatus" AS ENUM ('NEW', 'SCORED_LOW', 'PENDING', 'SKIPPED', 'SENT');

-- CreateTable
CREATE TABLE "JobLead" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "applyEmail" TEXT,
    "matchScore" INTEGER,
    "reasoning" TEXT,
    "emphasis" TEXT,
    "draftEmail" TEXT,
    "status" "JobLeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobLead_sourceId_key" ON "JobLead"("sourceId");
