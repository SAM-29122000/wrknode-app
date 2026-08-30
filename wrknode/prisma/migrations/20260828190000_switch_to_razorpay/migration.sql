-- RenameColumn
ALTER TABLE "ClientRequest" RENAME COLUMN "stripeCheckoutSessionId" TO "razorpayOrderId";

-- RenameIndex
ALTER INDEX "ClientRequest_stripeCheckoutSessionId_key" RENAME TO "ClientRequest_razorpayOrderId_key";
