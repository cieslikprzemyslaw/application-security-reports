import { z } from 'zod';

import type { Threat } from '../threat.js';
import { getOwaspTop10CategoryByValue } from '../owaspTop10.js';

import {
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
  severitySchema,
  strideCategorySchema,
  threatStatusSchema,
  timestampSchema,
} from './common.schema.js';

export const threatObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    assessmentId: nonEmptyIdSchema,
    title: nonEmptyTextSchema,
    description: z.string().trim(),
    severity: severitySchema,
    strideCategories: z.array(strideCategorySchema).min(1),
    status: threatStatusSchema,
    owaspCategoryCode: optionalTrimmedTextSchema,
    customCategory: optionalTrimmedTextSchema,
    affectedAsset: optionalTrimmedTextSchema,
    impact: optionalTrimmedTextSchema,
    recommendation: optionalTrimmedTextSchema,
    remediation: optionalTrimmedTextSchema,
    observation: optionalTrimmedTextSchema,
    reproductionSteps: optionalTrimmedTextSchema,
    affectedComponent: optionalTrimmedTextSchema,
    affectedEndpoint: optionalTrimmedTextSchema,
    risk: optionalTrimmedTextSchema,
    references: optionalTrimmedTextSchema,
    evidenceCount: nonNegativeIntegerSchema.optional(),
    resolutionNote: optionalTrimmedTextSchema,
    acceptedRiskJustification: optionalTrimmedTextSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const threatSchema = threatObjectSchema;

export const createThreatOwaspCategoryCodeSchema = (
  assessmentVersion: string,
) =>
  z
    .string()
    .trim()
    .refine(
      value =>
        value === 'custom' ||
        getOwaspTop10CategoryByValue(value, assessmentVersion) !== undefined,
      `Unsupported OWASP category code for assessment taxonomy version ${assessmentVersion}`,
    );

type ThreatSchemaOutput = Required<z.output<typeof threatSchema>>;
const threatSchemaCompatibilityCheck: ThreatSchemaOutput extends Threat
  ? true
  : never = true;

export const threatsFileSchema = z.array(threatSchema);
