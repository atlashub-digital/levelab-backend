-- Durable ARO webhook event store: dedupes provider/reconciliation events by
-- event id (P2002 on retry). See src/aro/aro-webhook.controller.ts.
CREATE TABLE "AroWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AroWebhookEvent_pkey" PRIMARY KEY ("id")
);
