import { z } from 'zod';

import type {
  AssessmentReportListItem,
  ReportVersionSummary,
} from '../report-list.js';
import { reportObjectSchema } from './report.schema.js';
import {
  isoDateStringSchema,
  positiveIntegerSchema,
  prefixedUuidSchema,
  reportVersionStatusSchema,
} from './common.schema.js';

export const reportListQuerySchema = z
  .object({
    assessmentId: prefixedUuidSchema('asm_', 'Assessment'),
  })
  .strict();

export const reportVersionSummaryObjectSchema = z
  .object({
    id: prefixedUuidSchema('rvs_', 'ReportVersion'),
    version: positiveIntegerSchema,
    status: reportVersionStatusSchema,
    generatedAt: isoDateStringSchema,
  })
  .strict();

export const reportVersionSummarySchema = reportVersionSummaryObjectSchema;

export const assessmentReportListItemObjectSchema = reportObjectSchema
  .extend({
    versions: z.array(reportVersionSummarySchema),
  })
  .strict();

export const assessmentReportListItemSchema =
  assessmentReportListItemObjectSchema;

export const assessmentReportListResponseSchema = z.array(
  assessmentReportListItemSchema,
);

type ReportVersionSummarySchemaOutput = Required<
  z.output<typeof reportVersionSummarySchema>
>;
const _reportVersionSummaryCompatibilityCheck: ReportVersionSummarySchemaOutput extends ReportVersionSummary
  ? true
  : never = true;

type AssessmentReportListItemSchemaOutput = Required<
  z.output<typeof assessmentReportListItemSchema>
>;
const _assessmentReportListItemCompatibilityCheck: AssessmentReportListItemSchemaOutput extends AssessmentReportListItem
  ? true
  : never = true;
