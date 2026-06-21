-- AlterTable
ALTER TABLE "Company" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Company_archivedAt_idx" ON "Company"("archivedAt");
