-- Preserve the existing deterministic threatId order while introducing
-- explicit per-report positions for future request-order persistence.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ReportThreat" (
    "reportId" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("reportId", "threatId"),
    CONSTRAINT "ReportThreat_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportThreat_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "Threat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_ReportThreat" ("reportId", "threatId", "position")
SELECT
    currentLink."reportId",
    currentLink."threatId",
    (
        SELECT COUNT(*) - 1
        FROM "ReportThreat" rankedLink
        WHERE rankedLink."reportId" = currentLink."reportId"
          AND rankedLink."threatId" <= currentLink."threatId"
    )
FROM "ReportThreat" currentLink;

DROP TABLE "ReportThreat";
ALTER TABLE "new_ReportThreat" RENAME TO "ReportThreat";

CREATE UNIQUE INDEX "ReportThreat_reportId_position_key"
ON "ReportThreat"("reportId", "position");

CREATE INDEX "ReportThreat_threatId_idx"
ON "ReportThreat"("threatId");

PRAGMA foreign_keys=ON;