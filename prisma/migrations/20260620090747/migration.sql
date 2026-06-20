/*
  Warnings:

  - You are about to drop the column `logoPath` on the `Company` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "logoUrl" TEXT,
    "footerText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("contactEmail", "contactName", "createdAt", "description", "footerText", "id", "logoUrl", "name", "updatedAt", "website") SELECT "contactEmail", "contactName", "createdAt", "description", "footerText", "id", "logoUrl", "name", "updatedAt", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE INDEX "Company_name_idx" ON "Company"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
