import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportPreviewSnapshot, Severity, ThreatStatus } from '~/domain';

export interface ReportPreviewSeverityCount {
  severity: Severity;
  count: number;
}

export interface ReportPreviewRiskPresentation {
  overallRisk: Severity;
  totalFindings: number;
  openThreats: number;
  retestRequired: number;
  severityCounts: ReportPreviewSeverityCount[];
}

export interface ReportPreviewPresentation {
  cover: Omit<ReportCoverProps, 'companyLogo'>;
  logoUrl?: string;
  logoAlt: string;
  riskSummary: ReportPreviewRiskPresentation;
  severityDistribution: ReportPreviewSeverityCount[];
}

export interface ReportPreviewPresentationMetadata {
  reportId?: string;
  issuedDate?: string;
}

const severityOrder: Severity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
];

const openThreatStatuses = new Set<ThreatStatus>([
  'draft',
  'open',
  'in-review',
]);

const retestThreatStatuses = new Set<ThreatStatus>(['resolved', 'mitigated']);

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not specified';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const toEvidenceItems = (
  snapshot: ReportPreviewSnapshot,
  threatId: string,
): ReportPreviewSnapshot['selectedEvidence'] | undefined => {
  if (snapshot.configuration.includeEvidence === false) {
    return undefined;
  }

  const evidenceSelections = snapshot.selection.evidenceSelections ?? [];
  const scopedEvidenceIds = new Set(
    evidenceSelections.map(selection => selection.evidenceId),
  );
  const evidence = snapshot.selectedEvidence.filter(item => {
    if (!scopedEvidenceIds.has(item.id)) {
      return item.threatIds.includes(threatId);
    }

    return evidenceSelections.some(
      selection =>
        selection.evidenceId === item.id && selection.threatId === threatId,
    );
  });

  return evidence.length > 0 ? evidence : undefined;
};

const resolveLogo = (snapshot: ReportPreviewSnapshot) => {
  if (snapshot.branding.brandingMode === 'issuer') {
    return {
      logoUrl: snapshot.branding.issuerLogoUrl ?? undefined,
      logoAlt: `${snapshot.branding.issuerName ?? 'Report issuer'} logo`,
    };
  }

  if (snapshot.branding.brandingMode === 'client') {
    return {
      logoUrl: snapshot.branding.companyLogoUrl ?? undefined,
      logoAlt: `${snapshot.company.name} logo`,
    };
  }

  return {
    logoUrl: undefined,
    logoAlt: '',
  };
};

const toRiskPresentation = (
  snapshot: ReportPreviewSnapshot,
): ReportPreviewRiskPresentation => {
  const severityCounts = severityOrder.map(severity => ({
    severity,
    count: snapshot.selectedThreats.filter(
      threat => threat.severity === severity,
    ).length,
  }));

  return {
    overallRisk: snapshot.riskSummary.overallRisk ?? 'informational',
    totalFindings: snapshot.riskSummary.threatCount,
    openThreats: snapshot.selectedThreats.filter(threat =>
      openThreatStatuses.has(threat.status),
    ).length,
    retestRequired: snapshot.selectedThreats.filter(threat =>
      retestThreatStatuses.has(threat.status),
    ).length,
    severityCounts,
  };
};

export const toReportPreviewPresentation = (
  snapshot: ReportPreviewSnapshot,
  metadata: ReportPreviewPresentationMetadata = {},
): ReportPreviewPresentation => {
  const logo = resolveLogo(snapshot);
  const riskSummary = toRiskPresentation(snapshot);

  return {
    ...logo,
    riskSummary,
    severityDistribution: riskSummary.severityCounts,
    cover: {
      companyName: snapshot.company.name,
      companyWebsite: snapshot.company.website ?? '',
      companyContactEmail: snapshot.company.contactEmail,
      reportId: metadata.reportId ?? snapshot.assessment.id,
      issuedDate: metadata.issuedDate
        ? formatDate(metadata.issuedDate)
        : 'Preview',
      applicationName:
        snapshot.assessment.applicationName ?? snapshot.assessment.title,
      environment: snapshot.assessment.environment ?? 'Not specified',
      engagementDate: formatDate(
        snapshot.assessment.completedAt ?? snapshot.assessment.startedAt,
      ),
      testerName:
        snapshot.branding.issuerContactName ??
        snapshot.branding.issuerName ??
        'Not assigned',
      methodology:
        snapshot.configuration.methodology ??
        snapshot.assessment.assessmentType ??
        'Not specified',
      findingsCount: snapshot.riskSummary.threatCount,
      overallRisk: riskSummary.overallRisk,
      executiveSummary:
        snapshot.assessment.description ??
        'Preview generated from the selected assessment content.',
      scope: snapshot.assessment.scope ? [snapshot.assessment.scope] : [],
      findings: snapshot.selectedThreats.map(threat => ({
        id: threat.id,
        title: threat.title,
        severity: threat.severity,
        status: threat.status,
        affectedAsset:
          threat.affectedAsset ??
          threat.affectedEndpoint ??
          threat.affectedComponent ??
          'Not specified',
        observation:
          threat.observation ?? threat.description ?? 'Not specified',
        risk: threat.risk ?? threat.impact ?? 'Not specified',
        recommendation:
          threat.recommendation ?? threat.remediation ?? 'Not specified',
        evidence: toEvidenceItems(snapshot, threat.id),
      })),
      footerText:
        snapshot.branding.brandingMode === 'client'
          ? snapshot.branding.companyFooterText
          : (snapshot.branding.reportFooterText ??
            snapshot.branding.companyFooterText),
      confidential: snapshot.branding.confidentialReports ?? false,
    },
  };
};
