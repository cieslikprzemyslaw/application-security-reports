-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "attachmentSizeBytes" INTEGER;

-- CreateTable
CREATE TABLE "EvidenceExchange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvidenceExchange_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceExchange_evidenceId_position_key" ON "EvidenceExchange"("evidenceId", "position");

-- CreateIndex
CREATE INDEX "EvidenceExchange_evidenceId_idx" ON "EvidenceExchange"("evidenceId");
