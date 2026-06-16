-- AlterTable
ALTER TABLE "Student" ADD COLUMN "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "RoadCodeTrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadCodeTrainingSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoadCodeTrainingSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "RoadCodeTrainingSession_companyId_createdAt_idx" ON "RoadCodeTrainingSession"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "RoadCodeTrainingSession_studentId_createdAt_idx" ON "RoadCodeTrainingSession"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "RoadCodeTrainingSession_studentId_theme_idx" ON "RoadCodeTrainingSession"("studentId", "theme");
