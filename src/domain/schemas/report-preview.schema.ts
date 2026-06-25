import { z } from 'zod';

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

export const reportEvidenceSelectionObjectSchema = z
  .object({
    threatId: prefixedUuidSchema('thr_', 'Threat'),
    evidenceId: prefixedUuidSchema('evd_', 'Evidence'),
  })
  .strict();

export const reportEvidenceSelectionSchema =
  reportEvidenceSelectionObjectSchema;

export const reportEvidenceSelectionListSchema = z
  .array(reportEvidenceSelectionSchema)
  .refine(
    value =>
      new Set(value.map(item => `${item.threatId}:${item.evidenceId}`)).size ===
      value.length,
    'Evidence selections must not contain duplicate Threat/Evidence pairs',
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
    evidenceSelections: reportEvidenceSelectionListSchema.optional(),
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

export const reportPreviewCompanyObjectSchema = companyObjectSchema
  .pick({
    id: true,
    name: true,
    description: true,
    website: true,
    contactName: true,
    contactEmail: true,
    logoUrl: true,
    footerText: true,
  })
  .strict();

export const reportPreviewCompanySchema = reportPreviewCompanyObjectSchema;

export const reportPreviewAssessmentObjectSchema = assessmentObjectSchema
  .pick({
    id: true,
    companyId: true,
    title: true,
    description: true,
    scope: true,
    status: true,
    startedAt: true,
    completedAt: true,
    applicationName: true,
    environment: true,
    assessmentType: true,
    overallRisk: true,
    owaspTaxonomyVersion: true,
  })
  .strict();

export const reportPreviewAssessmentSchema =
  reportPreviewAssessmentObjectSchema;

export const reportPreviewThreatObjectSchema = threatObjectSchema
  .pick({
    id: true,
    assessmentId: true,
    title: true,
    description: true,
    severity: true,
    strideCategories: true,
    status: true,
    owaspCategoryCode: true,
    customCategory: true,
    affectedAsset: true,
    impact: true,
    recommendation: true,
    remediation: true,
    observation: true,
    reproductionSteps: true,
    affectedComponent: true,
    affectedEndpoint: true,
    risk: true,
    references: true,
    evidenceCount: true,
    resolutionNote: true,
    acceptedRiskJustification: true,
  })
  .strict();

export const reportPreviewThreatSchema = reportPreviewThreatObjectSchema;

const reportPreviewAttachmentUrlSchema = z
  .string()
  .trim()
  .refine(value => {
    if (!value.startsWith('/uploads/evidence/')) {
      return false;
    }

    try {
      const decodedPath = decodeURIComponent(
        value.slice('/uploads/evidence/'.length),
      );
      const segments = decodedPath.split('/');

      return (
        segments.length > 0 &&
        segments.every(
          segment =>
            segment.length > 0 &&
            segment !== '.' &&
            segment !== '..' &&
            !segment.includes('\\'),
        )
      );
    } catch {
      return false;
    }
  }, 'Evidence attachment URL must stay inside the public Evidence route');

export const reportPreviewEvidenceObjectSchema = evidenceObjectSchema
  .pick({
    id: true,
    assessmentId: true,
    threatIds: true,
    type: true,
    title: true,
    description: true,
    content: true,
    fileName: true,
    mimeType: true,
    attachmentSizeBytes: true,
    capturedAt: true,
    httpExchanges: true,
  })
  .extend({
    attachmentUrl: reportPreviewAttachmentUrlSchema.optional(),
  })
  .strict();

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

export type ReportEvidenceSelection = z.output<
  typeof reportEvidenceSelectionSchema
>;

export type ReportPreviewSelection = z.output<
  typeof reportPreviewSelectionSchema
>;

export type ReportPreviewConfiguration = z.output<
  typeof reportPreviewConfigurationSchema
>;

export type ReportPreviewRequest = z.output<typeof reportPreviewRequestSchema>;

export type ReportPreviewCompany = z.output<typeof reportPreviewCompanySchema>;

export type ReportPreviewAssessment = z.output<
  typeof reportPreviewAssessmentSchema
>;

export type ReportPreviewThreat = z.output<typeof reportPreviewThreatSchema>;

export type ReportPreviewEvidence = z.output<
  typeof reportPreviewEvidenceSchema
>;

export type ReportPreviewBranding = z.output<
  typeof reportPreviewBrandingSchema
>;

export type ReportPreviewRiskSummary = z.output<
  typeof reportPreviewRiskSummarySchema
>;

export type ReportPreviewSnapshot = z.output<
  typeof reportPreviewSnapshotSchema
>;
