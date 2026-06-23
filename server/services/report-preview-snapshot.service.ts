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

const copyReportPreviewCompany = (
  company: ReportPreviewCompany,
): ReportPreviewCompany => ({
  id: company.id,
  name: company.name,
  description: company.description,
  website: company.website,
  contactName: company.contactName,
  contactEmail: company.contactEmail,
  logoUrl: company.logoUrl ?? null,
  footerText: company.footerText,
});

const toReportPreviewAssessment = (
  assessment: ResolvedReportPreviewRecords['assessment'],
) => ({
  id: assessment.id,
  companyId: assessment.companyId,
  title: assessment.title,
  description: assessment.description,
  scope: assessment.scope,
  status: assessment.status,
  startedAt: assessment.startedAt,
  completedAt: assessment.completedAt,
  applicationName: assessment.applicationName,
  environment: assessment.environment,
  assessmentType: assessment.assessmentType,
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
  owaspCategoryCode: threat.owaspCategoryCode,
  customCategory: threat.customCategory,
  affectedAsset: threat.affectedAsset,
  impact: threat.impact,
  recommendation: threat.recommendation,
  remediation: threat.remediation,
  observation: threat.observation,
  reproductionSteps: threat.reproductionSteps,
  affectedComponent: threat.affectedComponent,
  affectedEndpoint: threat.affectedEndpoint,
  risk: threat.risk,
  references: threat.references,
  evidenceCount: threat.evidenceCount,
  resolutionNote: threat.resolutionNote,
  acceptedRiskJustification: threat.acceptedRiskJustification,
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
    statusText: exchange.response.statusText,
    headers: exchange.response.headers
      ? { ...exchange.response.headers }
      : undefined,
    body: exchange.response.body,
  },
});

const toReportPreviewEvidence = (
  evidence: Evidence,
): ReportPreviewEvidence => ({
  id: evidence.id,
  assessmentId: evidence.assessmentId,
  threatIds: [...evidence.threatIds],
  type: evidence.type,
  title: evidence.title,
  description: evidence.description,
  content: evidence.content,
  fileName: evidence.fileName,
  mimeType: evidence.mimeType,
  attachmentSizeBytes: evidence.attachmentSizeBytes,
  capturedAt: evidence.capturedAt,
  httpExchanges: evidence.httpExchanges?.map(copyHttpExchange),
});

const copyReportPreviewBranding = (
  branding: ReportPreviewBranding,
  brandingMode: ReportPreviewRequest['brandingMode'],
): ReportPreviewBranding => ({
  brandingMode,
  companyName: branding.companyName,
  companyWebsite: branding.companyWebsite,
  companyContactEmail: branding.companyContactEmail,
  companyLogoUrl: branding.companyLogoUrl,
  companyFooterText: branding.companyFooterText,
  issuerName: branding.issuerName,
  issuerContactName: branding.issuerContactName,
  issuerContactEmail: branding.issuerContactEmail,
  issuerLogoUrl: branding.issuerLogoUrl,
  reportFooterText: branding.reportFooterText,
  reportConfidentialityLabel: branding.reportConfidentialityLabel,
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
