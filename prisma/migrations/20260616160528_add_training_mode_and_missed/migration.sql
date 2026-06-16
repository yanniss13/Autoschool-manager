-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoadCodeTrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'training',
    "missedIds" TEXT,
    "companyId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadCodeTrainingSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoadCodeTrainingSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoadCodeTrainingSession" ("companyId", "createdAt", "id", "score", "studentId", "theme", "total", "updatedAt") SELECT "companyId", "createdAt", "id", "score", "studentId", "theme", "total", "updatedAt" FROM "RoadCodeTrainingSession";
DROP TABLE "RoadCodeTrainingSession";
ALTER TABLE "new_RoadCodeTrainingSession" RENAME TO "RoadCodeTrainingSession";
CREATE INDEX "RoadCodeTrainingSession_companyId_createdAt_idx" ON "RoadCodeTrainingSession"("companyId", "createdAt");
CREATE INDEX "RoadCodeTrainingSession_studentId_createdAt_idx" ON "RoadCodeTrainingSession"("studentId", "createdAt");
CREATE INDEX "RoadCodeTrainingSession_studentId_theme_idx" ON "RoadCodeTrainingSession"("studentId", "theme");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
