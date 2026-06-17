-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "issuerLogoId" TEXT;
ALTER TABLE "Settings" ADD COLUMN "reportConfidentialityLabel" TEXT;
ALTER TABLE "Settings" ADD COLUMN "allowedBrandingModes" JSONB;
ALTER TABLE "Settings" ADD COLUMN "defaultBrandingMode" TEXT;
