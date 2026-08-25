-- AlterTable
ALTER TABLE "ClientRequest" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientRequest_stripeCheckoutSessionId_key" ON "ClientRequest"("stripeCheckoutSessionId");
