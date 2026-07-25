import { z } from 'zod';

import {
  nonEmptyTextSchema,
  optionalTrimmedTextSchema,
  prefixedUuidSchema,
  timestampSchema,
} from './common.schema.js';

const templateNameSchema = nonEmptyTextSchema.max(
  120,
  'Template name must be 120 characters or fewer',
);
const reusableFieldSchema = nonEmptyTextSchema.max(
  200,
  'Value must be 200 characters or fewer',
);
const optionalReusableTextSchema = optionalTrimmedTextSchema.refine(
  value => value === undefined || value.length <= 4000,
  'Value must be 4000 characters or fewer',
);

export const assessmentTemplateObjectSchema = z
  .object({
    id: prefixedUuidSchema('tpl_', 'Assessment Template'),
    name: templateNameSchema,
    assessmentType: reusableFieldSchema,
    environment: reusableFieldSchema,
    description: optionalReusableTextSchema,
    scope: optionalReusableTextSchema,
    archivedAt: timestampSchema.nullable().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const assessmentTemplateSchema = assessmentTemplateObjectSchema;

export const createAssessmentTemplateRequestSchema = z
  .object({
    name: templateNameSchema,
    assessmentType: reusableFieldSchema,
    environment: reusableFieldSchema,
    description: optionalReusableTextSchema,
    scope: optionalReusableTextSchema,
  })
  .strict();

export const updateAssessmentTemplateRequestSchema =
  createAssessmentTemplateRequestSchema
    .partial()
    .refine(value => Object.keys(value).length > 0, {
      message: 'At least one Assessment Template field is required',
    });

export const assessmentTemplateRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('tpl_', 'Assessment Template'),
  })
  .strict();

export const assessmentTemplateListQuerySchema = z
  .object({
    includeArchived: z
      .enum(['true', 'false'])
      .transform(value => value === 'true')
      .optional(),
  })
  .strict();

export const assessmentTemplateResponseSchema = z
  .object({
    data: assessmentTemplateSchema,
  })
  .strict();

export const assessmentTemplateListResponseSchema = z
  .object({
    data: z.array(assessmentTemplateSchema),
  })
  .strict();
