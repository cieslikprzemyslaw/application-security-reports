import { z } from 'zod';

import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../assessment.js';
import type {
  Company,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../company.js';
import type {
  Evidence,
  CreateEvidenceInput,
  UpdateEvidenceInput,
} from '../evidence.js';
import type {
  Report,
  CreateReportInput,
  UpdateReportInput,
} from '../report.js';
import type {
  Settings,
  CreateSettingsInput,
  UpdateSettingsInput,
} from '../settings.js';
import type {
  Threat,
  CreateThreatInput,
  UpdateThreatInput,
} from '../threat.js';

import { assessmentObjectSchema } from './assessment.schema.js';
import { companyObjectSchema } from './company.schema.js';
import { evidenceObjectSchema } from './evidence.schema.js';
import { reportObjectSchema } from './report.schema.js';
import { settingsObjectSchema } from './settings.schema.js';
import { threatObjectSchema } from './threat.schema.js';

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

export const createCompanyRequestSchema = createCompanyBaseSchema;
type CreateCompanyRequestSchemaOutput = Required<
  z.output<typeof createCompanyRequestSchema>
>;
const createCompanyRequestSchemaCompatibilityCheck: CreateCompanyRequestSchemaOutput extends CreateCompanyInput
  ? true
  : never = true;

export const updateCompanyRequestSchema = requireAtLeastOneField(
  createCompanyBaseSchema.partial(),
  'At least one company field is required',
);
type UpdateCompanyRequestSchemaOutput = Required<
  z.output<typeof updateCompanyRequestSchema>
>;
const updateCompanyRequestSchemaCompatibilityCheck: UpdateCompanyRequestSchemaOutput extends UpdateCompanyInput
  ? true
  : never = true;

const createAssessmentBaseSchema = assessmentObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createAssessmentRequestSchema = createAssessmentBaseSchema;
type CreateAssessmentRequestSchemaOutput = Required<
  z.output<typeof createAssessmentRequestSchema>
>;
const createAssessmentRequestSchemaCompatibilityCheck: CreateAssessmentRequestSchemaOutput extends CreateAssessmentInput
  ? true
  : never = true;

export const updateAssessmentRequestSchema = requireAtLeastOneField(
  createAssessmentBaseSchema.partial(),
  'At least one assessment field is required',
);
type UpdateAssessmentRequestSchemaOutput = Required<
  z.output<typeof updateAssessmentRequestSchema>
>;
const updateAssessmentRequestSchemaCompatibilityCheck: UpdateAssessmentRequestSchemaOutput extends UpdateAssessmentInput
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
const createThreatRequestSchemaCompatibilityCheck: CreateThreatRequestSchemaOutput extends CreateThreatInput
  ? true
  : never = true;

export const updateThreatRequestSchema = requireAtLeastOneField(
  createThreatBaseSchema.partial(),
  'At least one threat field is required',
);
type UpdateThreatRequestSchemaOutput = Required<
  z.output<typeof updateThreatRequestSchema>
>;
const updateThreatRequestSchemaCompatibilityCheck: UpdateThreatRequestSchemaOutput extends UpdateThreatInput
  ? true
  : never = true;

const createEvidenceBaseSchema = evidenceObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createEvidenceRequestSchema = createEvidenceBaseSchema;
type CreateEvidenceRequestSchemaOutput = Required<
  z.output<typeof createEvidenceRequestSchema>
>;
const createEvidenceRequestSchemaCompatibilityCheck: CreateEvidenceRequestSchemaOutput extends CreateEvidenceInput
  ? true
  : never = true;

export const updateEvidenceRequestSchema = requireAtLeastOneField(
  createEvidenceBaseSchema.partial(),
  'At least one evidence field is required',
);
type UpdateEvidenceRequestSchemaOutput = Required<
  z.output<typeof updateEvidenceRequestSchema>
>;
const updateEvidenceRequestSchemaCompatibilityCheck: UpdateEvidenceRequestSchemaOutput extends UpdateEvidenceInput
  ? true
  : never = true;

const createReportBaseSchema = reportObjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  latestVersion: true,
});

type CreateReportRequestInput = Omit<CreateReportInput, 'latestVersion'>;

type UpdateReportRequestInput = Omit<UpdateReportInput, 'latestVersion'>;

export const createReportRequestSchema = createReportBaseSchema;
type CreateReportRequestSchemaOutput = Required<
  z.output<typeof createReportRequestSchema>
>;
const createReportRequestSchemaCompatibilityCheck: CreateReportRequestSchemaOutput extends CreateReportRequestInput
  ? true
  : never = true;

export const updateReportRequestSchema = requireAtLeastOneField(
  createReportBaseSchema.partial(),
  'At least one report field is required',
);
type UpdateReportRequestSchemaOutput = Required<
  z.output<typeof updateReportRequestSchema>
>;
const updateReportRequestSchemaCompatibilityCheck: UpdateReportRequestSchemaOutput extends UpdateReportRequestInput
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
const updateSettingsRequestSchemaCompatibilityCheck: UpdateSettingsRequestSchemaOutput extends UpdateSettingsInput
  ? true
  : never = true;

export const createSettingsRequestSchema = createSettingsBaseSchema;
type CreateSettingsRequestSchemaOutput = Required<
  z.output<typeof createSettingsRequestSchema>
>;
const createSettingsRequestSchemaCompatibilityCheck: CreateSettingsRequestSchemaOutput extends CreateSettingsInput
  ? true
  : never = true;
