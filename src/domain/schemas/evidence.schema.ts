import { z } from 'zod';

import type { Evidence } from '../evidence.js';

import {
  evidenceTypeSchema,
  isoDateStringSchema,
  nonNegativeIntegerSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  optionalTrimmedTextSchema,
  timestampSchema,
} from './common.schema.js';

const httpMessageSchema = z
  .object({
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
  })
  .strict();

export const httpRequestSchema = httpMessageSchema
  .extend({
    method: nonEmptyTextSchema,
    url: nonEmptyTextSchema,
  })
  .strict();

export const httpResponseSchema = httpMessageSchema
  .extend({
    statusCode: nonNegativeIntegerSchema,
    statusText: optionalTrimmedTextSchema,
  })
  .strict();

export const httpExchangeSchema = z
  .object({
    request: httpRequestSchema,
    response: httpResponseSchema,
  })
  .strict();

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
    storageKey: optionalTrimmedTextSchema,
    mimeType: optionalTrimmedTextSchema,
    attachmentSizeBytes: nonNegativeIntegerSchema.optional(),
    capturedAt: isoDateStringSchema.optional(),
    httpExchanges: z.array(httpExchangeSchema).optional(),
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
