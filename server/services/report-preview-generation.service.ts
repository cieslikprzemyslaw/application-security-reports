import type {
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '../../src/domain/report-preview.js';
import { ValidationError } from '../../src/validation/index.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import {
  resolveReportPreviewSelectedRecords,
  validateReportPreviewSelectedRecords,
} from './report-preview-selection.service.js';
import { buildReportPreviewSnapshot } from './report-preview-snapshot.service.js';

export interface ReportPreviewGenerationRepositories {
  assessmentRepository: Pick<AssessmentRepository, 'findById'>;
  companyRepository: Pick<CompanyRepository, 'findById'>;
  evidenceRepository: Pick<EvidenceRepository, 'findById'>;
  settingsRepository: Pick<SettingsRepository, 'get'>;
  threatRepository: Pick<ThreatRepository, 'findById'>;
}

export type ReportPreviewGenerationResource = 'company' | 'settings';

export class ReportPreviewGenerationNotFoundError extends RepositoryNotFoundError {
  constructor(public readonly resource: ReportPreviewGenerationResource) {
    super(
      resource === 'company' ? 'Company not found.' : 'Settings not found.',
    );
    this.name = 'ReportPreviewGenerationNotFoundError';
  }
}

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

export const generateReportPreviewSnapshot = async (
  request: ReportPreviewRequest,
  repositories: ReportPreviewGenerationRepositories,
  baseUrl: string,
  warnings: readonly string[] = [],
): Promise<ReportPreviewSnapshot> => {
  const [company, settings] = await Promise.all([
    repositories.companyRepository.findById(request.companyId),
    repositories.settingsRepository.get(),
  ]);

  if (!company) {
    throw new ReportPreviewGenerationNotFoundError('company');
  }

  if (!settings) {
    throw new ReportPreviewGenerationNotFoundError('settings');
  }

  requireAllowedBrandingMode(request, settings);

  const records = validateReportPreviewSelectedRecords(
    request,
    await resolveReportPreviewSelectedRecords(request, repositories),
  );

  return buildReportPreviewSnapshot({
    request,
    company: toPreviewCompany(company, baseUrl),
    records,
    branding: toPreviewBranding(company, settings, request, baseUrl),
    warnings,
  });
};
