-- CreateEnum
CREATE TYPE "PlanCtaType" AS ENUM ('CHECKOUT', 'SIGNUP', 'CONTACT');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "priceINR" INTEGER NOT NULL,
    "priceUSD" INTEGER NOT NULL,
    "features" TEXT[],
    "ctaType" "PlanCtaType" NOT NULL DEFAULT 'CHECKOUT',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
