-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AssessmentTemplate_archivedAt_idx"
ON "AssessmentTemplate"("archivedAt");

-- CreateIndex
CREATE INDEX "AssessmentTemplate_updatedAt_idx"
ON "AssessmentTemplate"("updatedAt");
