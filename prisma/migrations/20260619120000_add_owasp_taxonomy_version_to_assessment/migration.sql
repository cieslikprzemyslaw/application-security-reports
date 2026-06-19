-- Add assessment OWASP taxonomy version
ALTER TABLE "Assessment" ADD COLUMN "owaspTaxonomyVersion" TEXT NOT NULL DEFAULT '2025';
