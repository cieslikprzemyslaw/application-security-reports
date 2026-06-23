import { Router, type Response } from 'express';

import type {
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '../../src/domain/report-preview.js';
import {
  reportPreviewRequestSchema,
  reportPreviewSnapshotSchema,
} from '../../src/domain/schemas/index.js';
import { ValidationError } from '../../src/validation/index.js';
import { RepositoryError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  ReportPreviewSelectionNotFoundError,
  resolveReportPreviewSelectedRecords,
  validateReportPreviewSelectedRecords,
} from '../services/report-preview-selection.service.js';
import { buildReportPreviewSnapshot } from '../services/report-preview-snapshot.service.js';
import { buildBaseUrl } from './companies.route.shared.js';
import { asyncRoute } from './settings.route.shared.js';

type ReportPreviewRepositories = {
  assessmentRepository: AssessmentRepository;
  companyRepository: CompanyRepository;
  evidenceRepository: EvidenceRepository;
  settingsRepository: SettingsRepository;
  threatRepository: ThreatRepository;
};

const sendPreviewResponse = (
  res: Response,
  snapshot: ReportPreviewSnapshot,
): Response =>
  res.status(200).json({
    data: reportPreviewSnapshotSchema.parse(snapshot),
  });

const toPreviewCompany = (
  company: NonNullable<Awaited<ReturnType<CompanyRepository['findById']>>>,
  baseUrl: string,
): ReportPreviewCompany => ({
  id: company.id,
  name: company.name,
  description: company.description,
  website: company.website,
  contactName: company.contactName,
  contactEmail: company.contactEmail,
  logoUrl: company.logoUrl
    ? `${baseUrl}/api/companies/${company.id}/logo`
    : null,
  footerText: company.footerText,
});

const toPreviewBranding = (
  company: NonNullable<Awaited<ReturnType<CompanyRepository['findById']>>>,
  settings: NonNullable<Awaited<ReturnType<SettingsRepository['get']>>>,
  request: ReportPreviewRequest,
  baseUrl: string,
): ReportPreviewBranding => ({
  brandingMode: request.brandingMode,
  companyName: company.name,
  companyWebsite: company.website,
  companyContactEmail: company.contactEmail,
  companyLogoUrl: company.logoUrl
    ? `${baseUrl}/api/companies/${company.id}/logo`
    : null,
  companyFooterText: company.footerText,
  issuerName: settings.organisationName,
  issuerContactName: settings.consultantName,
  issuerContactEmail: settings.consultantEmail,
  issuerLogoUrl: settings.issuerLogoId
    ? `${baseUrl}/api/settings/issuer-logo`
    : null,
  reportFooterText: settings.reportFooterText,
  reportConfidentialityLabel: settings.reportConfidentialityLabel,
  confidentialReports: settings.confidentialReports,
  allowedBrandingModes: settings.allowedBrandingModes,
  defaultBrandingMode: settings.defaultBrandingMode,
});

const requireAllowedBrandingMode = (
  request: ReportPreviewRequest,
  settings: NonNullable<Awaited<ReturnType<SettingsRepository['get']>>>,
): void => {
  if (
    settings.allowedBrandingModes &&
    !settings.allowedBrandingModes.includes(request.brandingMode)
  ) {
    throw new ValidationError({
      error: 'VALIDATION_ERROR',
      fields: [
        {
          path: 'brandingMode',
          message: 'Branding mode is not allowed by Settings.',
          code: 'custom',
        },
      ],
    });
  }
};

const handleMissingSelection = (
  error: ReportPreviewSelectionNotFoundError,
  res: Response,
): void => {
  const mapping = {
    assessment: {
      code: 'ASSESSMENT_NOT_FOUND' as const,
      message: 'Assessment not found',
    },
    threat: {
      code: 'THREAT_NOT_FOUND' as const,
      message: 'Threat not found',
    },
    evidence: {
      code: 'EVIDENCE_NOT_FOUND' as const,
      message: 'Evidence not found',
    },
  };

  const response = mapping[error.resource];
  sendApiError(res, 404, response.code, response.message);
};

const handlePreviewError = (error: unknown, res: Response): boolean => {
  if (error instanceof ReportPreviewSelectionNotFoundError) {
    handleMissingSelection(error, res);
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected report preview repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

export const createReportsPreviewRouter = (
  repositories: ReportPreviewRepositories,
): Router => {
  const router = Router();

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: reportPreviewRequestSchema,
    }),
    asyncRoute(async (req, res) => {
      const request = res.locals.validatedRequest?.body as ReportPreviewRequest;

      try {
        const [company, settings] = await Promise.all([
          repositories.companyRepository.findById(request.companyId),
          repositories.settingsRepository.get(),
        ]);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        if (!settings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        requireAllowedBrandingMode(request, settings);

        const records = validateReportPreviewSelectedRecords(
          request,
          await resolveReportPreviewSelectedRecords(request, repositories),
        );
        const baseUrl = buildBaseUrl(req);
        const snapshot = buildReportPreviewSnapshot({
          request,
          company: toPreviewCompany(company, baseUrl),
          records,
          branding: toPreviewBranding(company, settings, request, baseUrl),
        });

        sendPreviewResponse(res, snapshot);
      } catch (error) {
        if (!handlePreviewError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
