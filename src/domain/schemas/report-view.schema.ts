import { z } from 'zod';

import type { ReportView } from '../report-view.js';

import { assessmentSchema } from './assessment.schema.js';
import { companySchema } from './company.schema.js';
import { evidenceSchema } from './evidence.schema.js';
import { reportSchema, reportSnapshotSchema } from './report.schema.js';
import { threatSchema } from './threat.schema.js';
import {
  prefixedUuidSchema,
  reportBrandingModeSchema,
} from './common.schema.js';

export const reportViewEvidenceSchema = evidenceSchema.omit({
  filePath: true,
});

export const reportViewFindingSchema = z
  .object({
    threat: threatSchema,
    evidence: z.array(reportViewEvidenceSchema),
  })
  .strict();

export const reportViewAssessmentSchema = z
  .object({
    assessment: assessmentSchema,
    findings: z.array(reportViewFindingSchema),
  })
  .strict();

export const reportViewBrandingSchema = z
  .object({
    companyName: z.string().trim().min(1),
    companyWebsite: z.string().trim().url().optional(),
    companyContactEmail: z.string().trim().email().optional(),
    companyLogoPath: z.string().trim().min(1).optional(),
    companyFooterText: z.string().trim().min(1).optional(),
    issuerName: z.string().trim().min(1).optional(),
    issuerContactName: z.string().trim().min(1).optional(),
    issuerContactEmail: z.string().trim().email().optional(),
    issuerLogoId: prefixedUuidSchema('logo_', 'Issuer logo').optional(),
    reportFooterText: z.string().trim().min(1).optional(),
    reportConfidentialityLabel: z.string().trim().min(1).optional(),
    confidentialReports: z.boolean().optional(),
    allowedBrandingModes: z.array(reportBrandingModeSchema).min(1).optional(),
    defaultBrandingMode: reportBrandingModeSchema.optional(),
  })
  .strict();

export const reportViewConfigurationSchema = z
  .object({
    methodology: z.string().trim().min(1).optional(),
    reportStyle: z.string().trim().min(1).optional(),
    includeEvidence: z.boolean().optional(),
  })
  .strict();

export const reportViewSchema = z
  .object({
    report: reportSchema,
    company: companySchema,
    assessments: z.array(reportViewAssessmentSchema),
    branding: reportViewBrandingSchema,
    configuration: reportViewConfigurationSchema,
    snapshot: reportSnapshotSchema,
  })
  .strict();

type ReportViewSchemaOutput = Required<z.output<typeof reportViewSchema>>;
const _reportViewSchemaCompatibilityCheck: ReportViewSchemaOutput extends ReportView
  ? true
  : never = true;
