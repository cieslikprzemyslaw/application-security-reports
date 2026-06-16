-- AlterTable
ALTER TABLE "Threat" ADD COLUMN "owaspCategoryCode" TEXT;
ALTER TABLE "Threat" ADD COLUMN "customCategory" TEXT;
ALTER TABLE "Threat" ADD COLUMN "remediation" TEXT;
ALTER TABLE "Threat" ADD COLUMN "reproductionSteps" TEXT;
ALTER TABLE "Threat" ADD COLUMN "references" TEXT;
