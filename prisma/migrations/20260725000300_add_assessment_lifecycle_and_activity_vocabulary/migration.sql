-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN "recordVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Assessment" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Assessment" ADD COLUMN "archivedFromStatus" TEXT;

UPDATE "Assessment"
SET
  "archivedAt" = "updatedAt",
  "archivedFromStatus" = CASE
    WHEN "completedAt" IS NOT NULL THEN 'completed'
    WHEN "startedAt" IS NOT NULL THEN 'in-progress'
    ELSE 'draft'
  END
WHERE "status" = 'archived';

CREATE INDEX "Assessment_archivedAt_idx" ON "Assessment"("archivedAt");

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'legacy.created';
ALTER TABLE "Activity" ADD COLUMN "result" TEXT NOT NULL DEFAULT 'success';
ALTER TABLE "Activity" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'informational';
ALTER TABLE "Activity" ADD COLUMN "actorType" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Activity" ADD COLUMN "actorId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "resourceType" TEXT NOT NULL DEFAULT 'settings';
ALTER TABLE "Activity" ADD COLUMN "resourceId" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Activity" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "assessmentId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "correlationId" TEXT;

UPDATE "Activity"
SET
  "eventType" = 'legacy.' || "action",
  "resourceType" = "entityType",
  "resourceId" = COALESCE("entityId", "id");

CREATE INDEX "Activity_resourceType_resourceId_createdAt_idx"
ON "Activity"("resourceType", "resourceId", "createdAt");
CREATE INDEX "Activity_companyId_createdAt_idx"
ON "Activity"("companyId", "createdAt");
CREATE INDEX "Activity_assessmentId_createdAt_idx"
ON "Activity"("assessmentId", "createdAt");
CREATE INDEX "Activity_correlationId_idx" ON "Activity"("correlationId");
