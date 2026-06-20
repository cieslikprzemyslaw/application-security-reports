import { z } from 'zod';

import type { Assessment } from '../assessment.js';
import { isOwaspTop10Version } from '../owaspTop10.js';

import {
  assessmentStatusSchema,
  isoDateStringSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  severitySchema,
  timestampSchema,
  optionalTrimmedTextSchema,
} from './common.schema.js';

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
    owaspTaxonomyVersion: z
      .string()
      .refine(isOwaspTop10Version, 'Unsupported OWASP taxonomy version'),
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
