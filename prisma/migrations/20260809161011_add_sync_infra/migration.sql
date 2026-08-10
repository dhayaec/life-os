-- AlterTable
ALTER TABLE "HabitEntry" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SyncOp" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SyncTombstone" ALTER COLUMN "id" DROP DEFAULT;
