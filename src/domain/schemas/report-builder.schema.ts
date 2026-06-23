import { z } from 'zod';

import {
  optionalEmailSchema,
  optionalTrimmedTextSchema,
  optionalUrlSchema,
  prefixedUuidSchema,
  reportBrandingModeSchema,
  urlSchema,
} from './common.schema.js';

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

const reportBuilderBrandingModeListSchema = z
  .array(reportBrandingModeSchema)
  .min(1, 'At least one branding mode is required')
  .refine(
    value => new Set(value).size === value.length,
    'Branding modes must not contain duplicates',
  );

export const reportBuilderSelectionObjectSchema = z
  .object({
    selectedAssessmentId: prefixedUuidSchema('asm_', 'Assessment').optional(),
    selectedThreatIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('thr_', 'Threat'),
      'Threat',
    ).default([]),
    selectedEvidenceIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('evd_', 'Evidence'),
      'Evidence',
    ).default([]),
  })
  .strict();

export const reportBuilderSelectionSchema = reportBuilderSelectionObjectSchema;

export const reportBuilderConfigurationObjectSchema = z
  .object({
    methodology: optionalTrimmedTextSchema,
    reportStyle: optionalTrimmedTextSchema,
    includeEvidence: z.boolean().default(false),
  })
  .strict();

export const reportBuilderConfigurationSchema =
  reportBuilderConfigurationObjectSchema;

export const reportBuilderBrandingObjectSchema = z
  .object({
    brandingMode: reportBrandingModeSchema.default('issuer'),
    companyName: optionalTrimmedTextSchema,
    companyWebsite: optionalUrlSchema,
    companyContactEmail: optionalEmailSchema,
    companyLogoUrl: urlSchema.nullable().optional(),
    companyFooterText: optionalTrimmedTextSchema,
    issuerName: optionalTrimmedTextSchema,
    issuerContactName: optionalTrimmedTextSchema,
    issuerContactEmail: optionalEmailSchema,
    issuerLogoUrl: urlSchema.nullable().optional(),
    reportFooterText: optionalTrimmedTextSchema,
    reportConfidentialityLabel: optionalTrimmedTextSchema,
    confidentialReports: z.boolean().default(false),
    allowedBrandingModes: reportBuilderBrandingModeListSchema.optional(),
    defaultBrandingMode: reportBrandingModeSchema.optional(),
  })
  .strict();

export const reportBuilderBrandingSchema = reportBuilderBrandingObjectSchema;

export const reportBuilderStateObjectSchema = z
  .object({
    selection: reportBuilderSelectionSchema,
    configuration: reportBuilderConfigurationSchema,
    branding: reportBuilderBrandingSchema,
  })
  .strict();

export const reportBuilderStateSchema = reportBuilderStateObjectSchema;

export const reportBuilderRouteSelectionObjectSchema = z
  .object({
    selectedAssessmentId: prefixedUuidSchema('asm_', 'Assessment').optional(),
    selectedThreatIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('thr_', 'Threat'),
      'Threat',
    ).optional(),
    selectedEvidenceIds: uniquePrefixedUuidArraySchema(
      prefixedUuidSchema('evd_', 'Evidence'),
      'Evidence',
    ).optional(),
  })
  .strict();

export const reportBuilderRouteSelectionSchema =
  reportBuilderRouteSelectionObjectSchema;

export const reportBuilderRouteConfigurationObjectSchema = z
  .object({
    methodology: optionalTrimmedTextSchema,
    reportStyle: optionalTrimmedTextSchema,
    includeEvidence: z.boolean().optional(),
  })
  .strict();

export const reportBuilderRouteConfigurationSchema =
  reportBuilderRouteConfigurationObjectSchema;

export const reportBuilderRouteBrandingObjectSchema = z
  .object({
    brandingMode: reportBrandingModeSchema.optional(),
    companyName: optionalTrimmedTextSchema,
    companyWebsite: optionalUrlSchema,
    companyContactEmail: optionalEmailSchema,
    companyLogoUrl: urlSchema.nullable().optional(),
    companyFooterText: optionalTrimmedTextSchema,
    issuerName: optionalTrimmedTextSchema,
    issuerContactName: optionalTrimmedTextSchema,
    issuerContactEmail: optionalEmailSchema,
    issuerLogoUrl: urlSchema.nullable().optional(),
    reportFooterText: optionalTrimmedTextSchema,
    reportConfidentialityLabel: optionalTrimmedTextSchema,
    confidentialReports: z.boolean().optional(),
    allowedBrandingModes: reportBuilderBrandingModeListSchema.optional(),
    defaultBrandingMode: reportBrandingModeSchema.optional(),
  })
  .strict();

export const reportBuilderRouteBrandingSchema =
  reportBuilderRouteBrandingObjectSchema;

export const reportBuilderRouteStateObjectSchema = z
  .object({
    selection: reportBuilderRouteSelectionSchema.optional(),
    configuration: reportBuilderRouteConfigurationSchema.optional(),
    branding: reportBuilderRouteBrandingSchema.optional(),
  })
  .strict();

export const reportBuilderRouteStateSchema =
  reportBuilderRouteStateObjectSchema;

export type ReportBuilderSelection = z.output<
  typeof reportBuilderSelectionSchema
>;

export type ReportBuilderConfiguration = z.output<
  typeof reportBuilderConfigurationSchema
>;

export type ReportBuilderBranding = z.output<
  typeof reportBuilderBrandingSchema
>;

export type ReportBuilderState = z.output<typeof reportBuilderStateSchema>;

export type ReportBuilderRouteSelection = z.output<
  typeof reportBuilderRouteSelectionSchema
>;

export type ReportBuilderRouteConfiguration = z.output<
  typeof reportBuilderRouteConfigurationSchema
>;

export type ReportBuilderRouteBranding = z.output<
  typeof reportBuilderRouteBrandingSchema
>;

export type ReportBuilderRouteState = z.output<
  typeof reportBuilderRouteStateSchema
>;
