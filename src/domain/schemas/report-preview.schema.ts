import { z } from 'zod';

import type {
  ReportPreviewAssessment,
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewConfiguration,
  ReportPreviewEvidence,
  ReportPreviewRequest,
  ReportPreviewRiskSummary,
  ReportPreviewSelection,
  ReportPreviewSnapshot,
  ReportPreviewThreat,
} from '../report-preview.js';

import { assessmentObjectSchema } from './assessment.schema.js';
import { companyObjectSchema } from './company.schema.js';
import {
  nonEmptyTextSchema,
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
  optionalUrlSchema,
  prefixedUuidSchema,
  reportBrandingModeSchema,
  severitySchema,
  urlSchema,
} from './common.schema.js';
import { evidenceObjectSchema } from './evidence.schema.js';
import { threatObjectSchema } from './threat.schema.js';

const uniquePrefixedUuidArraySchema = (
  itemSchema: z.ZodString,
  entityName: string,
) =>
  z
    .array(itemSchema)
    .refine(
      value => new Set(value).size === value.length,
      `${entityName} IDs must not contain duplicates`,
    );

export const reportPreviewSelectionObjectSchema = z
  .object({
    threatIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('thr_', 'Threat'),
      'Threat',
    ),
    evidenceIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('evd_', 'Evidence'),
      'Evidence',
    ),
  })
  .strict();

export const reportPreviewSelectionSchema = reportPreviewSelectionObjectSchema;

export const reportPreviewConfigurationObjectSchema = z
  .object({
    methodology: optionalTrimmedTextSchema,
    reportStyle: optionalTrimmedTextSchema,
    includeEvidence: z.boolean().optional(),
  })
  .strict();

export const reportPreviewConfigurationSchema =
  reportPreviewConfigurationObjectSchema;

export const reportPreviewRequestObjectSchema = z
  .object({
    companyId: prefixedUuidSchema('cmp_', 'Company'),
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
    selection: reportPreviewSelectionSchema,
    configuration: reportPreviewConfigurationSchema,
    brandingMode: reportBrandingModeSchema,
  })
  .strict();

export const reportPreviewRequestSchema = reportPreviewRequestObjectSchema;

export const reportPreviewCompanyObjectSchema = companyObjectSchema.omit({
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
});

export const reportPreviewCompanySchema = reportPreviewCompanyObjectSchema;

export const reportPreviewAssessmentObjectSchema = assessmentObjectSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const reportPreviewAssessmentSchema =
  reportPreviewAssessmentObjectSchema;

export const reportPreviewThreatObjectSchema = threatObjectSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const reportPreviewThreatSchema = reportPreviewThreatObjectSchema;

export const reportPreviewEvidenceObjectSchema = evidenceObjectSchema.omit({
  createdAt: true,
  updatedAt: true,
  filePath: true,
  storageKey: true,
});

export const reportPreviewEvidenceSchema = reportPreviewEvidenceObjectSchema;

const reportPreviewBrandingModeListSchema = z
  .array(reportBrandingModeSchema)
  .min(1)
  .refine(
    value => new Set(value).size === value.length,
    'Branding modes must not contain duplicates',
  );

export const reportPreviewBrandingObjectSchema = z
  .object({
    brandingMode: reportBrandingModeSchema,
    companyName: nonEmptyTextSchema,
    companyWebsite: optionalUrlSchema,
    companyContactEmail: z.string().trim().email().optional(),
    companyLogoUrl: urlSchema.nullable().optional(),
    companyFooterText: optionalTrimmedTextSchema,
    issuerName: optionalTrimmedTextSchema,
    issuerContactName: optionalTrimmedTextSchema,
    issuerContactEmail: z.string().trim().email().optional(),
    issuerLogoUrl: urlSchema.nullable().optional(),
    reportFooterText: optionalTrimmedTextSchema,
    reportConfidentialityLabel: optionalTrimmedTextSchema,
    confidentialReports: z.boolean().optional(),
    allowedBrandingModes: reportPreviewBrandingModeListSchema.optional(),
    defaultBrandingMode: reportBrandingModeSchema.optional(),
  })
  .strict();

export const reportPreviewBrandingSchema = reportPreviewBrandingObjectSchema;

export const reportPreviewRiskSummaryObjectSchema = z
  .object({
    overallRisk: severitySchema.optional(),
    threatCount: nonNegativeIntegerSchema,
    evidenceCount: nonNegativeIntegerSchema,
  })
  .strict();

export const reportPreviewRiskSummarySchema =
  reportPreviewRiskSummaryObjectSchema;

export const reportPreviewSnapshotObjectSchema = z
  .object({
    company: reportPreviewCompanySchema,
    assessment: reportPreviewAssessmentSchema,
    selection: reportPreviewSelectionSchema,
    configuration: reportPreviewConfigurationSchema,
    branding: reportPreviewBrandingSchema,
    selectedThreats: z.array(reportPreviewThreatSchema),
    selectedEvidence: z.array(reportPreviewEvidenceSchema),
    riskSummary: reportPreviewRiskSummarySchema,
    warnings: z.array(nonEmptyTextSchema),
  })
  .strict();

export const reportPreviewSnapshotSchema = reportPreviewSnapshotObjectSchema;

type ReportPreviewSelectionSchemaOutput = Required<
  z.output<typeof reportPreviewSelectionSchema>
>;
const _reportPreviewSelectionSchemaCompatibilityCheck: ReportPreviewSelectionSchemaOutput extends ReportPreviewSelection
  ? true
  : never = true;

type ReportPreviewConfigurationSchemaOutput = Required<
  z.output<typeof reportPreviewConfigurationSchema>
>;
const _reportPreviewConfigurationSchemaCompatibilityCheck: ReportPreviewConfigurationSchemaOutput extends ReportPreviewConfiguration
  ? true
  : never = true;

type ReportPreviewRequestSchemaOutput = Required<
  z.output<typeof reportPreviewRequestSchema>
>;
const _reportPreviewRequestSchemaCompatibilityCheck: ReportPreviewRequestSchemaOutput extends ReportPreviewRequest
  ? true
  : never = true;

type ReportPreviewCompanySchemaOutput = Required<
  z.output<typeof reportPreviewCompanySchema>
>;
const _reportPreviewCompanySchemaCompatibilityCheck: ReportPreviewCompanySchemaOutput extends ReportPreviewCompany
  ? true
  : never = true;

type ReportPreviewAssessmentSchemaOutput = Required<
  z.output<typeof reportPreviewAssessmentSchema>
>;
const _reportPreviewAssessmentSchemaCompatibilityCheck: ReportPreviewAssessmentSchemaOutput extends ReportPreviewAssessment
  ? true
  : never = true;

type ReportPreviewThreatSchemaOutput = Required<
  z.output<typeof reportPreviewThreatSchema>
>;
const _reportPreviewThreatSchemaCompatibilityCheck: ReportPreviewThreatSchemaOutput extends ReportPreviewThreat
  ? true
  : never = true;

type ReportPreviewEvidenceSchemaOutput = Required<
  z.output<typeof reportPreviewEvidenceSchema>
>;
const _reportPreviewEvidenceSchemaCompatibilityCheck: ReportPreviewEvidenceSchemaOutput extends ReportPreviewEvidence
  ? true
  : never = true;

type ReportPreviewBrandingSchemaOutput = Required<
  z.output<typeof reportPreviewBrandingSchema>
>;
const _reportPreviewBrandingSchemaCompatibilityCheck: ReportPreviewBrandingSchemaOutput extends ReportPreviewBranding
  ? true
  : never = true;

type ReportPreviewRiskSummarySchemaOutput = Required<
  z.output<typeof reportPreviewRiskSummarySchema>
>;
const _reportPreviewRiskSummarySchemaCompatibilityCheck: ReportPreviewRiskSummarySchemaOutput extends ReportPreviewRiskSummary
  ? true
  : never = true;

type ReportPreviewSnapshotSchemaOutput = Required<
  z.output<typeof reportPreviewSnapshotSchema>
>;
const _reportPreviewSnapshotSchemaCompatibilityCheck: ReportPreviewSnapshotSchemaOutput extends ReportPreviewSnapshot
  ? true
  : never = true;
