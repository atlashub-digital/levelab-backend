-- Minimal deduplicated ARO webhook inbox; no financial/payment/provider record duplication.
CREATE TABLE "AroWebhookEvent" (
 "id" TEXT NOT NULL,
 "type" TEXT NOT NULL,
 "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AroWebhookEvent_pkey" PRIMARY KEY ("id")
);
