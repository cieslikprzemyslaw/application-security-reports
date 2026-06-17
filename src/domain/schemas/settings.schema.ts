import { z } from 'zod';

import type { Settings } from '../settings.js';

import {
  dateFormatSchema,
  nonEmptyIdSchema,
  optionalEmailSchema,
  optionalTrimmedTextSchema,
  prefixedUuidSchema,
  reportBrandingModeSchema,
  severitySchema,
  themePreferenceSchema,
  timestampSchema,
} from './common.schema.js';

const brandingModeListSchema = z
  .array(reportBrandingModeSchema)
  .min(1, 'At least one branding mode is required')
  .refine(
    value => new Set(value).size === value.length,
    'Branding modes must not contain duplicates',
  );

export const validateSettingsBrandingModes = (
  value: {
    allowedBrandingModes?: Array<string>;
    defaultBrandingMode?: string;
  },
  ctx: z.RefinementCtx,
) => {
  if (
    value.defaultBrandingMode &&
    value.allowedBrandingModes &&
    !value.allowedBrandingModes.includes(value.defaultBrandingMode)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultBrandingMode'],
      message: 'Default branding mode must be allowed',
    });
  }
};

export const settingsObjectBaseSchema = z
  .object({
    id: nonEmptyIdSchema,
    organisationName: optionalTrimmedTextSchema,
    consultantName: optionalTrimmedTextSchema,
    consultantEmail: optionalEmailSchema,
    issuerLogoId: prefixedUuidSchema('logo_', 'Issuer logo').optional(),
    defaultReportTitle: optionalTrimmedTextSchema,
    defaultSeverity: severitySchema,
    theme: themePreferenceSchema,
    dateFormat: dateFormatSchema,
    reportFooterText: optionalTrimmedTextSchema,
    reportConfidentialityLabel: optionalTrimmedTextSchema,
    methodology: optionalTrimmedTextSchema,
    reportStyle: optionalTrimmedTextSchema,
    includeEvidence: z.boolean().optional(),
    confidentialReports: z.boolean().optional(),
    allowedBrandingModes: brandingModeListSchema.optional(),
    defaultBrandingMode: reportBrandingModeSchema.optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const settingsObjectSchema = settingsObjectBaseSchema.superRefine(
  validateSettingsBrandingModes,
);

export const settingsSchema = settingsObjectSchema;

type SettingsSchemaOutput = Required<z.output<typeof settingsSchema>>;
const settingsSchemaCompatibilityCheck: SettingsSchemaOutput extends Settings
  ? true
  : never = true;

export const settingsFileSchema = settingsSchema;
