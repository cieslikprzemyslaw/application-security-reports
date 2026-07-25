-- CreateTable
CREATE TABLE "ThreatCwe" (
    "threatId" TEXT NOT NULL,
    "cweId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("threatId", "cweId"),
    CONSTRAINT "ThreatCwe_threatId_fkey" FOREIGN KEY ("threatId") REFERENCES "Threat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreatCwe_threatId_position_key"
ON "ThreatCwe"("threatId", "position");

-- CreateIndex
CREATE INDEX "ThreatCwe_cweId_idx" ON "ThreatCwe"("cweId");
