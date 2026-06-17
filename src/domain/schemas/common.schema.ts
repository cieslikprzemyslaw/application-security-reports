import { z } from 'zod';

import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_TYPES,
  ASSESSMENT_STATUSES,
  EVIDENCE_TYPES,
  REPORT_STATUSES,
  SEVERITIES,
  STRIDE_CATEGORIES,
  THREAT_STATUSES,
} from '../common.js';
import {
  DATE_FORMATS,
  REPORT_BRANDING_MODES,
  THEME_PREFERENCES,
} from '../settings.js';

const isRealCalendarDate = (value: string) => {
  const [yearPart, monthPart, dayPart] = value.split('-');

  if (!yearPart || !monthPart || !dayPart) {
    return false;
  }

  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
};

export const nonEmptyIdSchema = z.string().trim().min(1, 'ID is required');

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const prefixedUuidSchema = (prefix: string, entityName: string) =>
  z
    .string()
    .trim()
    .regex(
      new RegExp(
        `^${escapeRegExp(prefix)}[0-9a-fA-F]{8}-` +
          `[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-` +
          `[0-9a-fA-F]{12}$`,
      ),
      `${entityName} ID must be a prefixed UUID`,
    );

export const nonEmptyTextSchema = z.string().trim().min(1, 'Text is required');

export const trimmedTextSchema = z.string().trim();

export const optionalTrimmedTextSchema = z.string().trim().min(1).optional();

export const emailSchema = z.string().trim().email();

export const optionalEmailSchema = emailSchema.optional();

export const urlSchema = z.string().trim().url();

export const optionalUrlSchema = urlSchema.optional();

export const isoDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid ISO date string')
  .refine(isRealCalendarDate, { message: 'Invalid ISO date string' });

export const isoDateTimeStringSchema = z
  .string()
  .trim()
  .datetime({ offset: true });

export const timestampSchema = isoDateTimeStringSchema;

export const severitySchema = z.enum(SEVERITIES);

export const strideCategorySchema = z.enum(STRIDE_CATEGORIES);

export const evidenceTypeSchema = z.enum(EVIDENCE_TYPES);

export const assessmentStatusSchema = z.enum(ASSESSMENT_STATUSES);

export const threatStatusSchema = z.enum(THREAT_STATUSES);

export const reportStatusSchema = z.enum(REPORT_STATUSES);

export const activityActionSchema = z.enum(ACTIVITY_ACTIONS);

export const activityEntityTypeSchema = z.enum(ACTIVITY_ENTITY_TYPES);

export const themePreferenceSchema = z.enum(THEME_PREFERENCES);

export const dateFormatSchema = z.enum(DATE_FORMATS);

export const reportBrandingModeSchema = z.enum(REPORT_BRANDING_MODES);

export const nonNegativeIntegerSchema = z.number().int().min(0);

export const positiveIntegerSchema = z.number().int().positive();

export const nonEmptyStringArraySchema = z.array(nonEmptyTextSchema);
