import path from 'node:path';
import { z } from 'zod';

import type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../assessment.js';
import type { CreateCompanyInput, UpdateCompanyInput } from '../company.js';
import type { CreateEvidenceInput, UpdateEvidenceInput } from '../evidence.js';
import type { CreateReportInput, UpdateReportInput } from '../report.js';
import type { CreateSettingsInput, UpdateSettingsInput } from '../settings.js';
import type { CreateThreatInput, UpdateThreatInput } from '../threat.js';

import { assessmentObjectSchema } from './assessment.schema.js';
import { companyObjectSchema } from './company.schema.js';
import { evidenceObjectSchema } from './evidence.schema.js';
import { reportObjectSchema } from './report.schema.js';
import { settingsObjectSchema } from './settings.schema.js';
import { threatObjectSchema } from './threat.schema.js';
import {
  optionalTrimmedTextSchema,
  prefixedUuidSchema,
} from './common.schema.js';

const requireAtLeastOneField = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  message: string,
) =>
  schema.superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [],
      });
    }
  });

const createCompanyBaseSchema = companyObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const companyRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('cmp_', 'Company'),
  })
  .strict();

export const createCompanyRequestSchema = createCompanyBaseSchema;
type CreateCompanyRequestSchemaOutput = Required<
  z.output<typeof createCompanyRequestSchema>
>;
const _createCompanyRequestSchemaCompatibilityCheck: CreateCompanyRequestSchemaOutput extends CreateCompanyInput
  ? true
  : never = true;

export const updateCompanyRequestSchema = requireAtLeastOneField(
  createCompanyBaseSchema.partial(),
  'At least one company field is required',
);
type UpdateCompanyRequestSchemaOutput = Required<
  z.output<typeof updateCompanyRequestSchema>
>;
const _updateCompanyRequestSchemaCompatibilityCheck: UpdateCompanyRequestSchemaOutput extends UpdateCompanyInput
  ? true
  : never = true;

const createAssessmentBaseSchema = assessmentObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const assessmentRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

export const assessmentListQuerySchema = z
  .object({
    companyId: prefixedUuidSchema('cmp_', 'Company').optional(),
  })
  .strict();

export const threatRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('thr_', 'Threat'),
  })
  .strict();

export const threatListQuerySchema = z
  .object({
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

export const evidenceRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('evd_', 'Evidence'),
  })
  .strict();

export const evidenceListQuerySchema = z
  .object({
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

export const reportRouteParamsSchema = z
  .object({
    id: prefixedUuidSchema('rpt_', 'Report'),
  })
  .strict();

export const createAssessmentRequestSchema = createAssessmentBaseSchema;
type CreateAssessmentRequestSchemaOutput = Required<
  z.output<typeof createAssessmentRequestSchema>
>;
const _createAssessmentRequestSchemaCompatibilityCheck: CreateAssessmentRequestSchemaOutput extends CreateAssessmentInput
  ? true
  : never = true;

export const updateAssessmentRequestSchema = requireAtLeastOneField(
  createAssessmentBaseSchema.omit({ companyId: true }).partial(),
  'At least one assessment field is required',
);
type UpdateAssessmentRequestSchemaOutput = Required<
  z.output<typeof updateAssessmentRequestSchema>
>;
const _updateAssessmentRequestSchemaCompatibilityCheck: UpdateAssessmentRequestSchemaOutput extends UpdateAssessmentInput
  ? true
  : never = true;

const createThreatBaseSchema = threatObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createThreatRequestSchema = createThreatBaseSchema;
type CreateThreatRequestSchemaOutput = Required<
  z.output<typeof createThreatRequestSchema>
>;
const _createThreatRequestSchemaCompatibilityCheck: CreateThreatRequestSchemaOutput extends CreateThreatInput
  ? true
  : never = true;

export const updateThreatRequestSchema = requireAtLeastOneField(
  createThreatBaseSchema.omit({ assessmentId: true }).partial(),
  'At least one threat field is required',
);
type UpdateThreatRequestSchemaOutput = Required<
  z.output<typeof updateThreatRequestSchema>
>;
const _updateThreatRequestSchemaCompatibilityCheck: UpdateThreatRequestSchemaOutput extends UpdateThreatInput
  ? true
  : never = true;

const supportedEvidenceMimeTypes = [
  'application/json',
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
] as const;

const supportedEvidenceFileExtensionsByMimeType: Record<
  (typeof supportedEvidenceMimeTypes)[number],
  readonly string[]
> = {
  'application/json': ['.json'],
  'application/pdf': ['.pdf'],
  'image/gif': ['.gif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'text/plain': ['.txt'],
};

const isSafeEvidenceFileName = (value: string): boolean =>
  !/[\\/:<>"|?*\0]/.test(value) && value !== '.' && value !== '..';

const isEvidenceFileNameCompatibleWithMimeType = (
  fileName: string,
  mimeType: (typeof supportedEvidenceMimeTypes)[number],
): boolean => {
  const extension = path.extname(fileName).toLowerCase();
  const allowedExtensions = supportedEvidenceFileExtensionsByMimeType[mimeType];

  return allowedExtensions.includes(extension);
};

const evidenceFileNameSchema = optionalTrimmedTextSchema.refine(
  value => value === undefined || isSafeEvidenceFileName(value),
  'Evidence file name must not contain path separators',
);

const evidenceMimeTypeSchema = z.enum(supportedEvidenceMimeTypes).optional();

const evidenceRequestBaseSchema = evidenceObjectSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    filePath: true,
  })
  .extend({
    fileName: evidenceFileNameSchema,
    mimeType: evidenceMimeTypeSchema,
  });

const validateEvidenceFileMetadata = (
  value: {
    fileName?: string;
    mimeType?: (typeof supportedEvidenceMimeTypes)[number];
  },
  ctx: z.RefinementCtx,
) => {
  if (
    value.fileName &&
    value.mimeType &&
    !isEvidenceFileNameCompatibleWithMimeType(value.fileName, value.mimeType)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fileName'],
      message: 'Evidence file name extension must match the supplied mime type',
    });
  }
};

export const createEvidenceRequestSchema =
  evidenceRequestBaseSchema.superRefine(validateEvidenceFileMetadata);
type CreateEvidenceRequestSchemaOutput = Required<
  z.output<typeof createEvidenceRequestSchema>
>;
type CreateEvidenceRequestInput = Omit<CreateEvidenceInput, 'filePath'>;
const _createEvidenceRequestSchemaCompatibilityCheck: CreateEvidenceRequestSchemaOutput extends CreateEvidenceRequestInput
  ? true
  : never = true;

export const updateEvidenceRequestSchema = requireAtLeastOneField(
  evidenceRequestBaseSchema.omit({ assessmentId: true }).partial(),
  'At least one evidence field is required',
).superRefine(validateEvidenceFileMetadata);
type UpdateEvidenceRequestSchemaOutput = Required<
  z.output<typeof updateEvidenceRequestSchema>
>;
type UpdateEvidenceRequestInput = Omit<UpdateEvidenceInput, 'filePath'>;
const _updateEvidenceRequestSchemaCompatibilityCheck: UpdateEvidenceRequestSchemaOutput extends UpdateEvidenceRequestInput
  ? true
  : never = true;

const createReportBaseSchema = reportObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  latestVersion: true,
  status: true,
});

type CreateReportRequestInput = Omit<
  CreateReportInput,
  'latestVersion' | 'status'
>;

type UpdateReportRequestInput = Omit<
  UpdateReportInput,
  'latestVersion' | 'status'
>;

export const createReportRequestSchema = createReportBaseSchema;
type CreateReportRequestSchemaOutput = Required<
  z.output<typeof createReportRequestSchema>
>;
const _createReportRequestSchemaCompatibilityCheck: CreateReportRequestSchemaOutput extends CreateReportRequestInput
  ? true
  : never = true;

export const updateReportRequestSchema = requireAtLeastOneField(
  createReportBaseSchema.partial(),
  'At least one report field is required',
);
type UpdateReportRequestSchemaOutput = Required<
  z.output<typeof updateReportRequestSchema>
>;
const _updateReportRequestSchemaCompatibilityCheck: UpdateReportRequestSchemaOutput extends UpdateReportRequestInput
  ? true
  : never = true;

const createSettingsBaseSchema = settingsObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSettingsRequestSchema = requireAtLeastOneField(
  createSettingsBaseSchema.partial(),
  'At least one settings field is required',
);
type UpdateSettingsRequestSchemaOutput = Required<
  z.output<typeof updateSettingsRequestSchema>
>;
const _updateSettingsRequestSchemaCompatibilityCheck: UpdateSettingsRequestSchemaOutput extends UpdateSettingsInput
  ? true
  : never = true;

export const createSettingsRequestSchema = createSettingsBaseSchema;
type CreateSettingsRequestSchemaOutput = Required<
  z.output<typeof createSettingsRequestSchema>
>;
const _createSettingsRequestSchemaCompatibilityCheck: CreateSettingsRequestSchemaOutput extends CreateSettingsInput
  ? true
  : never = true;
