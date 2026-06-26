import type {
  ReportPreviewBranding,
  ReportPreviewCompany,
  ReportPreviewEvidence,
  ReportPreviewRequest,
  ReportPreviewSnapshot,
  ReportPreviewThreat,
} from '../../src/domain/report-preview.js';
import { reportPreviewSnapshotSchema } from '../../src/domain/schemas/report-preview.schema.js';
import type {
  Evidence,
  EvidenceHttpExchange,
} from '../../src/domain/evidence.js';
import type { Threat } from '../../src/domain/threat.js';
import { computeReportPreviewRiskSummary } from './report-preview-risk-summary.service.js';
import type { ResolvedReportPreviewRecords } from './report-preview-selection.service.js';

export interface BuildReportPreviewSnapshotInput {
  request: ReportPreviewRequest;
  company: ReportPreviewCompany;
  records: ResolvedReportPreviewRecords;
  branding: ReportPreviewBranding;
  warnings?: readonly string[];
}

const toOptionalPreviewText = (
  value: string | null | undefined,
): string | undefined => {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
};

const toNullablePreviewText = (
  value: string | null | undefined,
): string | null => toOptionalPreviewText(value) ?? null;

const previewIsoDateTimePattern =
  /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const toOptionalPreviewDate = (
  value: string | null | undefined,
): string | undefined => {
  const normalized = toOptionalPreviewText(value);

  if (!normalized) {
    return undefined;
  }

  return previewIsoDateTimePattern.exec(normalized)?.[1] ?? normalized;
};

const copyReportPreviewCompany = (
  company: ReportPreviewCompany,
): ReportPreviewCompany => ({
  id: company.id,
  name: company.name,
  description: toOptionalPreviewText(company.description),
  website: toOptionalPreviewText(company.website),
  contactName: toOptionalPreviewText(company.contactName),
  contactEmail: toOptionalPreviewText(company.contactEmail),
  logoUrl: company.logoUrl ?? null,
  footerText: toOptionalPreviewText(company.footerText),
});

const toReportPreviewAssessment = (
  assessment: ResolvedReportPreviewRecords['assessment'],
) => ({
  id: assessment.id,
  companyId: assessment.companyId,
  title: assessment.title,
  description: toOptionalPreviewText(assessment.description),
  scope: toOptionalPreviewText(assessment.scope),
  status: assessment.status,
  startedAt: toOptionalPreviewDate(assessment.startedAt),
  completedAt: toOptionalPreviewDate(assessment.completedAt),
  applicationName: toNullablePreviewText(assessment.applicationName),
  environment: toOptionalPreviewText(assessment.environment),
  assessmentType: toOptionalPreviewText(assessment.assessmentType),
  overallRisk: assessment.overallRisk,
  owaspTaxonomyVersion: assessment.owaspTaxonomyVersion,
});

const toReportPreviewThreat = (threat: Threat): ReportPreviewThreat => ({
  id: threat.id,
  assessmentId: threat.assessmentId,
  title: threat.title,
  description: threat.description,
  severity: threat.severity,
  strideCategories: [...threat.strideCategories],
  status: threat.status,
  owaspCategoryCode: toOptionalPreviewText(threat.owaspCategoryCode),
  customCategory: toOptionalPreviewText(threat.customCategory),
  affectedAsset: toOptionalPreviewText(threat.affectedAsset),
  impact: toOptionalPreviewText(threat.impact),
  recommendation: toOptionalPreviewText(threat.recommendation),
  remediation: toOptionalPreviewText(threat.remediation),
  observation: toOptionalPreviewText(threat.observation),
  reproductionSteps: toOptionalPreviewText(threat.reproductionSteps),
  affectedComponent: toOptionalPreviewText(threat.affectedComponent),
  affectedEndpoint: toOptionalPreviewText(threat.affectedEndpoint),
  risk: toOptionalPreviewText(threat.risk),
  references: toOptionalPreviewText(threat.references),
  evidenceCount: threat.evidenceCount,
  resolutionNote: toOptionalPreviewText(threat.resolutionNote),
  acceptedRiskJustification: toOptionalPreviewText(
    threat.acceptedRiskJustification,
  ),
});

const copyHttpExchange = (
  exchange: EvidenceHttpExchange,
): EvidenceHttpExchange => ({
  request: {
    method: exchange.request.method,
    url: exchange.request.url,
    headers: exchange.request.headers
      ? { ...exchange.request.headers }
      : undefined,
    body: exchange.request.body,
  },
  response: {
    statusCode: exchange.response.statusCode,
    statusText: toOptionalPreviewText(exchange.response.statusText),
    headers: exchange.response.headers
      ? { ...exchange.response.headers }
      : undefined,
    body: exchange.response.body,
  },
});

const evidenceRootPrefix = 'uploads/evidence/';

const toPublicEvidenceAttachmentUrl = (evidence: Evidence) => {
  for (const candidate of [evidence.storageKey, evidence.filePath]) {
    if (!candidate) {
      continue;
    }

    const normalizedPath = candidate.replace(/\\/g, '/').replace(/^\/+/, '');

    if (!normalizedPath.startsWith(evidenceRootPrefix)) {
      continue;
    }

    const relativePath = normalizedPath.slice(evidenceRootPrefix.length);
    const segments = relativePath.split('/');

    if (
      segments.length === 0 ||
      segments.some(
        segment => segment.length === 0 || segment === '.' || segment === '..',
      )
    ) {
      continue;
    }

    return `/uploads/evidence/${segments
      .map(segment => encodeURIComponent(segment))
      .join('/')}`;
  }

  return undefined;
};

const toReportPreviewEvidence = (
  evidence: Evidence,
): ReportPreviewEvidence => ({
  id: evidence.id,
  assessmentId: evidence.assessmentId,
  threatIds: [...evidence.threatIds],
  type: evidence.type,
  title: evidence.title,
  description: toOptionalPreviewText(evidence.description),
  content: toOptionalPreviewText(evidence.content),
  fileName: toOptionalPreviewText(evidence.fileName),
  mimeType: toOptionalPreviewText(evidence.mimeType),
  attachmentSizeBytes: evidence.attachmentSizeBytes,
  capturedAt: toOptionalPreviewText(evidence.capturedAt),
  httpExchanges: evidence.httpExchanges?.map(copyHttpExchange),
  attachmentUrl: toPublicEvidenceAttachmentUrl(evidence),
});

const copyReportPreviewBranding = (
  branding: ReportPreviewBranding,
  brandingMode: ReportPreviewRequest['brandingMode'],
): ReportPreviewBranding => ({
  brandingMode,
  companyName: branding.companyName,
  companyWebsite: toOptionalPreviewText(branding.companyWebsite),
  companyContactEmail: toOptionalPreviewText(branding.companyContactEmail),
  companyLogoUrl: branding.companyLogoUrl,
  companyFooterText: toOptionalPreviewText(branding.companyFooterText),
  issuerName: toOptionalPreviewText(branding.issuerName),
  issuerContactName: toOptionalPreviewText(branding.issuerContactName),
  issuerContactEmail: toOptionalPreviewText(branding.issuerContactEmail),
  issuerLogoUrl: branding.issuerLogoUrl,
  reportFooterText: toOptionalPreviewText(branding.reportFooterText),
  reportConfidentialityLabel: toOptionalPreviewText(
    branding.reportConfidentialityLabel,
  ),
  confidentialReports: branding.confidentialReports,
  allowedBrandingModes: branding.allowedBrandingModes
    ? [...branding.allowedBrandingModes]
    : undefined,
  defaultBrandingMode: branding.defaultBrandingMode,
});

export const buildReportPreviewSnapshot = ({
  request,
  company,
  records,
  branding,
  warnings = [],
}: BuildReportPreviewSnapshotInput): ReportPreviewSnapshot =>
  reportPreviewSnapshotSchema.parse({
    company: copyReportPreviewCompany(company),
    assessment: toReportPreviewAssessment(records.assessment),
    selection: {
      threatIds: [...request.selection.threatIds],
      evidenceIds: [...request.selection.evidenceIds],
      ...(request.selection.evidenceSelections
        ? {
            evidenceSelections: request.selection.evidenceSelections.map(
              selection => ({ ...selection }),
            ),
          }
        : {}),
    },
    configuration: {
      methodology: request.configuration.methodology,
      reportStyle: request.configuration.reportStyle,
      includeEvidence: request.configuration.includeEvidence,
    },
    branding: copyReportPreviewBranding(branding, request.brandingMode),
    selectedThreats: records.threats.map(toReportPreviewThreat),
    selectedEvidence: records.evidence.map(toReportPreviewEvidence),
    riskSummary: computeReportPreviewRiskSummary(records),
    warnings: [...warnings],
  });
