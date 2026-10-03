-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "authUserId" TEXT;

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entitlement_memberId_key_idx" ON "Entitlement"("memberId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Member_authUserId_key" ON "Member"("authUserId");

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backend-only access (see 20261003000100_enable_rls)
ALTER TABLE "Entitlement" ENABLE ROW LEVEL SECURITY;
