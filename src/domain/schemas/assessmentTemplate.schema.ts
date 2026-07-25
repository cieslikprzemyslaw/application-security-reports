import { z } from 'zod';

import type {
  AssessmentTemplate,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '../assessmentTemplate.js';
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

type AssessmentTemplateSchemaOutput = Required<
  z.output<typeof assessmentTemplateSchema>
>;
const _assessmentTemplateCompatibilityCheck: AssessmentTemplateSchemaOutput extends AssessmentTemplate
  ? true
  : never = true;

export const createAssessmentTemplateRequestSchema = z
  .object({
    name: templateNameSchema,
    assessmentType: reusableFieldSchema,
    environment: reusableFieldSchema,
    description: optionalReusableTextSchema,
    scope: optionalReusableTextSchema,
  })
  .strict();

type CreateRequestOutput = Required<
  z.output<typeof createAssessmentTemplateRequestSchema>
>;
const _createRequestCompatibilityCheck: CreateRequestOutput extends CreateAssessmentTemplateInput
  ? true
  : never = true;

export const updateAssessmentTemplateRequestSchema = createAssessmentTemplateRequestSchema
  .partial()
  .refine(value => Object.keys(value).length > 0, {
    message: 'At least one Assessment Template field is required',
  });

type UpdateRequestOutput = Required<
  z.output<typeof updateAssessmentTemplateRequestSchema>
>;
const _updateRequestCompatibilityCheck: UpdateRequestOutput extends UpdateAssessmentTemplateInput
  ? true
  : never = true;

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
