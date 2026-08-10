-- AlterTable: add updatedAt to HabitEntry and Notification
ALTER TABLE "HabitEntry" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: sync infrastructure
CREATE TABLE "SyncState" (
    "userId" TEXT NOT NULL,
    "watermark" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "SyncOp" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "opId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "opType" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncOp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncOp_userId_opId_key" ON "SyncOp"("userId", "opId");

CREATE INDEX "SyncOp_userId_createdAt_idx" ON "SyncOp"("userId", "createdAt");

CREATE TABLE "SyncTombstone" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncTombstone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncTombstone_userId_domain_recordId_key" ON "SyncTombstone"("userId", "domain", "recordId");

CREATE INDEX "SyncTombstone_userId_domain_deletedAt_idx" ON "SyncTombstone"("userId", "domain", "deletedAt");
