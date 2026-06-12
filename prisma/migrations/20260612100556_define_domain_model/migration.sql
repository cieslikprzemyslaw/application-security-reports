/*
  Warnings:

  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HealthCheck";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "logoPath" TEXT,
    "footerText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TEXT,
    "completedAt" TEXT,
    "applicationName" TEXT,
    "environment" TEXT,
    "assessmentType" TEXT,
    "overallRisk" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Threat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "strideCategories" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "affectedAsset" TEXT,
    "impact" TEXT,
    "recommendation" TEXT,
    "observation" TEXT,
    "affectedComponent" TEXT,
    "affectedEndpoint" TEXT,
    "risk" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Threat_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "mimeType" TEXT,
    "capturedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "latestVersion" INTEGER NOT NULL DEFAULT 0,
    "executiveSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceThreat" (
    "evidenceId" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,

    PRIMARY KEY ("evidenceId", "threatId"),
    CONSTRAINT "EvidenceThreat_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceThreat_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "Threat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportThreat" (
    "reportId" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,

    PRIMARY KEY ("reportId", "threatId"),
    CONSTRAINT "ReportThreat_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportThreat_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "Threat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationName" TEXT,
    "consultantName" TEXT,
    "consultantEmail" TEXT,
    "defaultReportTitle" TEXT,
    "defaultSeverity" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "dateFormat" TEXT NOT NULL,
    "reportFooterText" TEXT,
    "methodology" TEXT,
    "reportStyle" TEXT,
    "includeEvidence" BOOLEAN,
    "confidentialReports" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Assessment_companyId_idx" ON "Assessment"("companyId");

-- CreateIndex
CREATE INDEX "Assessment_companyId_updatedAt_idx" ON "Assessment"("companyId", "updatedAt");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "Threat_assessmentId_idx" ON "Threat"("assessmentId");

-- CreateIndex
CREATE INDEX "Threat_assessmentId_updatedAt_idx" ON "Threat"("assessmentId", "updatedAt");

-- CreateIndex
CREATE INDEX "Threat_status_idx" ON "Threat"("status");

-- CreateIndex
CREATE INDEX "Threat_severity_idx" ON "Threat"("severity");

-- CreateIndex
CREATE INDEX "Evidence_assessmentId_idx" ON "Evidence"("assessmentId");

-- CreateIndex
CREATE INDEX "Evidence_assessmentId_createdAt_idx" ON "Evidence"("assessmentId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_capturedAt_idx" ON "Evidence"("capturedAt");

-- CreateIndex
CREATE INDEX "Report_assessmentId_idx" ON "Report"("assessmentId");

-- CreateIndex
CREATE INDEX "Report_assessmentId_createdAt_idx" ON "Report"("assessmentId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "EvidenceThreat_threatId_idx" ON "EvidenceThreat"("threatId");

-- CreateIndex
CREATE INDEX "ReportThreat_threatId_idx" ON "ReportThreat"("threatId");

-- CreateIndex
CREATE INDEX "Activity_entityType_createdAt_idx" ON "Activity"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_entityId_idx" ON "Activity"("entityId");
