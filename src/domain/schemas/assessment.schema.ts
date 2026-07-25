import { z } from 'zod';

import type { Assessment } from '../assessment.js';
import { isCweCatalogVersion, type CweCatalogVersion } from '../cwe.js';
import { isOwaspTop10Version, type OwaspTop10Version } from '../owaspTop10.js';

import {
  assessmentStatusSchema,
  isoDateStringSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
  severitySchema,
  timestampSchema,
} from './common.schema.js';

export const owaspTop10VersionSchema = z.custom<OwaspTop10Version>(
  value => typeof value === 'string' && isOwaspTop10Version(value),
  'Unsupported OWASP taxonomy version',
);

export const cweCatalogVersionSchema = z.custom<CweCatalogVersion>(
  value => typeof value === 'string' && isCweCatalogVersion(value),
  'Unsupported CWE catalog version',
);

export const assessmentObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    companyId: nonEmptyIdSchema,
    title: nonEmptyTextSchema,
    description: optionalTrimmedTextSchema,
    scope: optionalTrimmedTextSchema,
    status: assessmentStatusSchema,
    startedAt: isoDateStringSchema.optional(),
    completedAt: isoDateStringSchema.optional(),
    applicationName: z.union([nonEmptyTextSchema, z.null()]),
    environment: optionalTrimmedTextSchema,
    assessmentType: optionalTrimmedTextSchema,
    overallRisk: severitySchema.optional(),
    owaspTaxonomyVersion: owaspTop10VersionSchema,
    cweCatalogVersion: cweCatalogVersionSchema,
    recordVersion: nonNegativeIntegerSchema.optional(),
    archivedAt: timestampSchema.nullable().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const assessmentSchema = assessmentObjectSchema;

type AssessmentSchemaOutput = Required<z.output<typeof assessmentSchema>>;
const _assessmentSchemaCompatibilityCheck: AssessmentSchemaOutput extends Assessment
  ? true
  : never = true;

export const assessmentsFileSchema = z.array(assessmentSchema);

export const assessmentDeletionImpactSchema = z
  .object({
    assessmentId: nonEmptyIdSchema,
    recordVersion: nonNegativeIntegerSchema,
    threatCount: nonNegativeIntegerSchema,
    evidenceCount: nonNegativeIntegerSchema,
    evidenceAttachmentCount: nonNegativeIntegerSchema,
    reportCount: nonNegativeIntegerSchema,
    reportVersionCount: nonNegativeIntegerSchema,
    canDelete: z.boolean(),
    warnings: z.array(nonEmptyTextSchema),
  })
  .strict();

export const assessmentPermanentDeleteResultSchema = z
  .object({
    cleanupWarnings: z.array(nonEmptyTextSchema),
  })
  .strict();
