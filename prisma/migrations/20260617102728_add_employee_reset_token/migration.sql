-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "resetTokenExpiresAt" DATETIME;
ALTER TABLE "Employee" ADD COLUMN "resetTokenHash" TEXT;
