import { z } from 'zod';

import type { Threat, ThreatResponse } from '../threat.js';
import { THREAT_REVIEW_COMMANDS } from '../threatReview.js';
import {
  getOwaspTop10CategoryByValue,
  type OwaspTop10Version,
} from '../owaspTop10.js';

import {
  cweCatalogVersionSchema,
  owaspTop10VersionSchema,
} from './assessment.schema.js';

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

export const cweIdSchema = z
  .string()
  .trim()
  .regex(/^CWE-\d+$/i, 'CWE ID must use the CWE-123 format')
  .transform(value => `CWE-${Number(value.slice(4))}`);

export const cweIdListSchema = z
  .array(cweIdSchema)
  .max(5, 'A Threat can contain at most five CWE mappings')
  .refine(
    values => new Set(values).size === values.length,
    'CWE mappings must not contain duplicates',
  );

export const threatCweMappingObjectSchema = z
  .object({
    id: cweIdSchema,
    name: nonEmptyTextSchema,
    status: z.enum(['Draft', 'Incomplete', 'Stable', 'Deprecated']),
    deprecated: z.boolean(),
    primary: z.boolean(),
    replacementIds: z.array(cweIdSchema),
  })
  .strict();

export const threatObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    assessmentId: nonEmptyIdSchema,
    title: nonEmptyTextSchema,
    description: z.string().trim(),
    severity: severitySchema,
    strideCategories: z.array(strideCategorySchema).min(1),
    status: threatStatusSchema,
    cweCatalogVersion: cweCatalogVersionSchema,
    cweMappings: z.array(threatCweMappingObjectSchema).max(5),
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

export const threatResponseSchema = threatObjectSchema
  .extend({
    assessmentOwaspTaxonomyVersion: owaspTop10VersionSchema,
    recordVersion: nonNegativeIntegerSchema.optional(),
    reviewActions: z
      .array(
        z
          .object({
            command: z.enum(THREAT_REVIEW_COMMANDS),
            label: nonEmptyTextSchema,
            allowed: z.boolean(),
            reason: optionalTrimmedTextSchema,
          })
          .strict(),
      )
      .optional(),
  })
  .strict()
  .transform(value => ({
    ...value,
    recordVersion: value.recordVersion ?? new Date(value.updatedAt).getTime(),
    reviewActions: value.reviewActions ?? [],
  }));

export const createThreatOwaspCategoryCodeSchema = (
  assessmentVersion: OwaspTop10Version,
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

export const threatReviewCommandSchema = z.enum(THREAT_REVIEW_COMMANDS);

export const threatReviewCommandRequestSchema = z
  .object({
    recordVersion: nonNegativeIntegerSchema,
  })
  .strict();

export const threatReviewCommandRouteParamsSchema = z
  .object({
    id: nonEmptyIdSchema,
    command: threatReviewCommandSchema,
  })
  .strict();

type ThreatResponseSchemaOutput = Required<
  z.output<typeof threatResponseSchema>
>;
const threatResponseSchemaCompatibilityCheck: ThreatResponseSchemaOutput extends ThreatResponse
  ? true
  : never = true;
