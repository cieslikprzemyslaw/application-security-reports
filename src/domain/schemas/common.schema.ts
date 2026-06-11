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
import { DATE_FORMATS, THEME_PREFERENCES } from '../settings.js';

const isoDateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

const isIsoDateString = (value: string) =>
  isoDateOnlyPattern.test(value) || isoTimestampPattern.test(value);

export const nonEmptyIdSchema = z.string().trim().min(1, 'ID is required');

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
  .min(1, 'ISO date string is required')
  .refine(isIsoDateString, { message: 'Invalid ISO date string' });

export const timestampSchema = isoDateStringSchema;

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

export const nonNegativeIntegerSchema = z.number().int().min(0);

export const positiveIntegerSchema = z.number().int().positive();

export const nonEmptyStringArraySchema = z.array(nonEmptyTextSchema);
