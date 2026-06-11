import { z } from 'zod';

import type { Report } from '../report.js';

import {
  isoDateStringSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
  positiveIntegerSchema,
  reportStatusSchema,
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

export const reportSnapshotObjectSchema = z
  .object({
    reportTitle: nonEmptyTextSchema,
    companyName: nonEmptyTextSchema,
    assessmentTitle: nonEmptyTextSchema,
    executiveSummary: optionalTrimmedTextSchema,
    threats: z.array(reportThreatSnapshotSchema),
  })
  .strict();

export const reportSnapshotSchema = reportSnapshotObjectSchema;

export const reportVersionObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    reportId: nonEmptyIdSchema,
    version: positiveIntegerSchema,
    generatedAt: isoDateStringSchema,
    filePath: optionalTrimmedTextSchema,
    snapshot: reportSnapshotSchema,
  })
  .strict();

export const reportVersionSchema = reportVersionObjectSchema;

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
