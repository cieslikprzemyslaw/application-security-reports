ALTER TABLE "Settings" ADD COLUMN "consultantRole" TEXT;

UPDATE "Settings"
SET "consultantRole" = 'Lead Pentester'
WHERE "consultantRole" IS NULL;
