import { z } from 'zod';

import type { Evidence } from '../evidence.js';

import {
  evidenceTypeSchema,
  isoDateStringSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  optionalTrimmedTextSchema,
  timestampSchema,
} from './common.schema.js';

export const evidenceObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    assessmentId: nonEmptyIdSchema,
    threatIds: z.array(nonEmptyIdSchema),
    type: evidenceTypeSchema,
    title: nonEmptyTextSchema,
    description: optionalTrimmedTextSchema,
    content: optionalTrimmedTextSchema,
    fileName: optionalTrimmedTextSchema,
    filePath: optionalTrimmedTextSchema,
    mimeType: optionalTrimmedTextSchema,
    capturedAt: isoDateStringSchema.optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const evidenceSchema = evidenceObjectSchema;

type EvidenceSchemaOutput = Required<z.output<typeof evidenceSchema>>;
const evidenceSchemaCompatibilityCheck: EvidenceSchemaOutput extends Evidence
  ? true
  : never = true;

export const evidenceFileSchema = z.array(evidenceSchema);
