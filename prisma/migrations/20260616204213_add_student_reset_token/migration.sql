-- AlterTable
ALTER TABLE "Student" ADD COLUMN "resetTokenExpiresAt" DATETIME;
ALTER TABLE "Student" ADD COLUMN "resetTokenHash" TEXT;
