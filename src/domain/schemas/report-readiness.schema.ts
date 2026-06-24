import { z } from 'zod';

import { nonEmptyTextSchema, prefixedUuidSchema } from './common.schema.js';

export const REPORT_READINESS_ERROR_CODES = [
  'REPORT_TITLE_REQUIRED',
  'THREAT_SELECTION_REQUIRED',
  'THREAT_DESCRIPTION_REQUIRED',
  'THREAT_IMPACT_REQUIRED',
  'THREAT_RECOMMENDATION_REQUIRED',
  'ISSUER_NAME_REQUIRED',
] as const;

export const REPORT_READINESS_WARNING_CODES = [
  'EVIDENCE_SELECTION_EMPTY',
  'THREAT_EVIDENCE_MISSING',
] as const;

export const REPORT_READINESS_CODES = [
  ...REPORT_READINESS_ERROR_CODES,
  ...REPORT_READINESS_WARNING_CODES,
] as const;

export const reportReadinessErrorCodeSchema = z.enum(
  REPORT_READINESS_ERROR_CODES,
);
export const reportReadinessWarningCodeSchema = z.enum(
  REPORT_READINESS_WARNING_CODES,
);
export const reportReadinessCodeSchema = z.enum(REPORT_READINESS_CODES);

const reportReadinessReportTargetSchema = z
  .object({
    resourceType: z.literal('report'),
    resourceId: prefixedUuidSchema('rpt_', 'Report'),
    field: nonEmptyTextSchema.optional(),
  })
  .strict();

const reportReadinessCompanyTargetSchema = z
  .object({
    resourceType: z.literal('company'),
    resourceId: prefixedUuidSchema('cmp_', 'Company'),
    field: nonEmptyTextSchema.optional(),
  })
  .strict();

const reportReadinessAssessmentTargetSchema = z
  .object({
    resourceType: z.literal('assessment'),
    resourceId: prefixedUuidSchema('asm_', 'Assessment'),
    field: nonEmptyTextSchema.optional(),
  })
  .strict();

const reportReadinessThreatTargetSchema = z
  .object({
    resourceType: z.literal('threat'),
    resourceId: prefixedUuidSchema('thr_', 'Threat'),
    field: nonEmptyTextSchema.optional(),
  })
  .strict();

const reportReadinessEvidenceTargetSchema = z
  .object({
    resourceType: z.literal('evidence'),
    resourceId: prefixedUuidSchema('evd_', 'Evidence'),
    field: nonEmptyTextSchema.optional(),
  })
  .strict();

export const reportReadinessTargetSchema = z.discriminatedUnion(
  'resourceType',
  [
    reportReadinessReportTargetSchema,
    reportReadinessCompanyTargetSchema,
    reportReadinessAssessmentTargetSchema,
    reportReadinessThreatTargetSchema,
    reportReadinessEvidenceTargetSchema,
  ],
);

const reportReadinessItemBaseSchema = z
  .object({
    message: nonEmptyTextSchema,
    target: reportReadinessTargetSchema,
  })
  .strict();

export const reportReadinessErrorItemSchema =
  reportReadinessItemBaseSchema.extend({
    code: reportReadinessErrorCodeSchema,
  });

export const reportReadinessWarningItemSchema =
  reportReadinessItemBaseSchema.extend({
    code: reportReadinessWarningCodeSchema,
  });

export const reportReadinessItemSchema = z.union([
  reportReadinessErrorItemSchema,
  reportReadinessWarningItemSchema,
]);

export const reportReadinessResultSchema = z
  .object({
    errors: z.array(reportReadinessErrorItemSchema),
    warnings: z.array(reportReadinessWarningItemSchema),
  })
  .strict();

export type ReportReadinessCode = z.output<typeof reportReadinessCodeSchema>;
export type ReportReadinessTarget = z.output<
  typeof reportReadinessTargetSchema
>;
export type ReportReadinessErrorItem = z.output<
  typeof reportReadinessErrorItemSchema
>;
export type ReportReadinessWarningItem = z.output<
  typeof reportReadinessWarningItemSchema
>;
export type ReportReadinessItem = z.output<typeof reportReadinessItemSchema>;
export type ReportReadinessResult = z.output<
  typeof reportReadinessResultSchema
>;
