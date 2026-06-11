import { z } from 'zod';

import type { Threat } from '../threat.js';

import {
  nonEmptyIdSchema,
  nonEmptyTextSchema,
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
    affectedAsset: optionalTrimmedTextSchema,
    impact: optionalTrimmedTextSchema,
    recommendation: optionalTrimmedTextSchema,
    observation: optionalTrimmedTextSchema,
    affectedComponent: optionalTrimmedTextSchema,
    affectedEndpoint: optionalTrimmedTextSchema,
    risk: optionalTrimmedTextSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const threatSchema = threatObjectSchema;

type ThreatSchemaOutput = Required<z.output<typeof threatSchema>>;
const threatSchemaCompatibilityCheck: ThreatSchemaOutput extends Threat
  ? true
  : never = true;

export const threatsFileSchema = z.array(threatSchema);
