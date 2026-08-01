-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'general';

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
