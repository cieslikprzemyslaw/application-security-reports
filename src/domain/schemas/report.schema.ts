import { z } from 'zod';

import type {
  CreateDraftReportVersionRequest,
  CreateFinalReportVersionRequest,
  Report,
  ReportVersion,
  ReportVersionResponse,
} from '../report.js';

import {
  reportPreviewRequestObjectSchema,
  reportPreviewRequestSchema,
  reportPreviewSnapshotSchema,
} from './report-preview.schema.js';

import {
  isoDateStringSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
  positiveIntegerSchema,
  prefixedUuidSchema,
  reportBrandingModeSchema,
  reportStatusSchema,
  reportVersionStatusSchema,
  severitySchema,
  strideCategorySchema,
  threatStatusSchema,
  timestampSchema,
} from './common.schema.js';

export const reportThreatSnapshotObjectSchema = z
  .object({
    threatId: nonEmptyIdSchema,
    title: nonEmptyTextSchema,
    description: z.string().trim(),
    severity: severitySchema,
    status: threatStatusSchema,
    strideCategories: z.array(strideCategorySchema).min(1),
    affectedAsset: optionalTrimmedTextSchema,
    impact: optionalTrimmedTextSchema,
    recommendation: optionalTrimmedTextSchema,
  })
  .strict();

export const reportThreatSnapshotSchema = reportThreatSnapshotObjectSchema;

export const reportSnapshotBrandingObjectSchema = z
  .object({
    brandingMode: reportBrandingModeSchema.optional(),
    issuerName: optionalTrimmedTextSchema,
    issuerContactName: optionalTrimmedTextSchema,
    issuerContactEmail: z.string().trim().email().optional(),
    issuerLogoId: prefixedUuidSchema('logo_', 'Issuer logo').optional(),
    clientName: nonEmptyTextSchema,
    clientWebsite: z.string().trim().url().optional(),
    clientContactEmail: z.string().trim().email().optional(),
    clientFooterText: optionalTrimmedTextSchema,
    reportFooterText: optionalTrimmedTextSchema,
    confidentialityLabel: optionalTrimmedTextSchema,
    confidentialReports: z.boolean().optional(),
  })
  .strict();

export const reportSnapshotBrandingSchema = reportSnapshotBrandingObjectSchema;

export const reportSnapshotObjectSchema = z
  .object({
    reportTitle: nonEmptyTextSchema,
    companyName: nonEmptyTextSchema,
    assessmentTitle: nonEmptyTextSchema,
    executiveSummary: optionalTrimmedTextSchema,
    branding: reportSnapshotBrandingSchema,
    threats: z.array(reportThreatSnapshotSchema),
  })
  .strict();

export const reportSnapshotSchema = reportSnapshotObjectSchema;

export const reportVersionObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    reportId: nonEmptyIdSchema,
    version: positiveIntegerSchema,
    status: reportVersionStatusSchema,
    generatedAt: isoDateStringSchema,
    filePath: optionalTrimmedTextSchema,
    snapshot: reportPreviewSnapshotSchema,
  })
  .strict();

export const reportVersionSchema = reportVersionObjectSchema;

type ReportVersionSchemaOutput = Required<z.output<typeof reportVersionSchema>>;
const _reportVersionSchemaCompatibilityCheck: ReportVersionSchemaOutput extends ReportVersion
  ? true
  : never = true;

export const createDraftReportVersionRequestSchema = reportPreviewRequestSchema;

type CreateDraftReportVersionRequestSchemaOutput = z.output<
  typeof createDraftReportVersionRequestSchema
>;
const _createDraftReportVersionRequestSchemaCompatibilityCheck: CreateDraftReportVersionRequestSchemaOutput extends CreateDraftReportVersionRequest
  ? true
  : never = true;

export const createFinalReportVersionRequestSchema =
  reportPreviewRequestObjectSchema
    .extend({ expectedLatestVersion: nonNegativeIntegerSchema })
    .strict();

type CreateFinalReportVersionRequestSchemaOutput = z.output<
  typeof createFinalReportVersionRequestSchema
>;
const _createFinalReportVersionRequestSchemaCompatibilityCheck: CreateFinalReportVersionRequestSchemaOutput extends CreateFinalReportVersionRequest
  ? true
  : never = true;

export const reportVersionResponseSchema = reportVersionSchema
  .omit({ filePath: true })
  .extend({
    id: prefixedUuidSchema('rvs_', 'ReportVersion'),
    reportId: prefixedUuidSchema('rpt_', 'Report'),
  })
  .strict();

export const reportVersionListResponseSchema = z.array(
  reportVersionResponseSchema,
);

type ReportVersionResponseSchemaOutput = Required<
  z.output<typeof reportVersionResponseSchema>
>;
const _reportVersionResponseSchemaCompatibilityCheck: ReportVersionResponseSchemaOutput extends ReportVersionResponse
  ? true
  : never = true;

type ReportVersionListResponseSchemaOutput = z.output<
  typeof reportVersionListResponseSchema
>;
const _reportVersionListResponseSchemaCompatibilityCheck: ReportVersionListResponseSchemaOutput extends ReportVersionResponse[]
  ? true
  : never = true;

export const reportObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    assessmentId: nonEmptyIdSchema,
    title: nonEmptyTextSchema,
    status: reportStatusSchema,
    selectedThreatIds: z.array(nonEmptyIdSchema),
    latestVersion: nonNegativeIntegerSchema,
    executiveSummary: optionalTrimmedTextSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const reportSchema = reportObjectSchema;

type ReportSchemaOutput = Required<z.output<typeof reportSchema>>;
const _reportSchemaCompatibilityCheck: ReportSchemaOutput extends Report
  ? true
  : never = true;

export const reportsFileSchema = z.array(reportSchema);
