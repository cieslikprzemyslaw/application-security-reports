import { z } from 'zod';

import type { Settings } from '../settings.js';

import {
  dateFormatSchema,
  nonEmptyIdSchema,
  optionalEmailSchema,
  optionalTrimmedTextSchema,
  severitySchema,
  themePreferenceSchema,
  timestampSchema,
} from './common.schema.js';

export const settingsObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    organisationName: optionalTrimmedTextSchema,
    consultantName: optionalTrimmedTextSchema,
    consultantEmail: optionalEmailSchema,
    defaultReportTitle: optionalTrimmedTextSchema,
    defaultSeverity: severitySchema,
    theme: themePreferenceSchema,
    dateFormat: dateFormatSchema,
    reportFooterText: optionalTrimmedTextSchema,
    methodology: optionalTrimmedTextSchema,
    reportStyle: optionalTrimmedTextSchema,
    includeEvidence: z.boolean().optional(),
    confidentialReports: z.boolean().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const settingsSchema = settingsObjectSchema;

type SettingsSchemaOutput = Required<z.output<typeof settingsSchema>>;
const settingsSchemaCompatibilityCheck: SettingsSchemaOutput extends Settings
  ? true
  : never = true;

export const settingsFileSchema = settingsSchema;
