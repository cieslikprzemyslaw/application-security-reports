import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { ReportPreviewSnapshot } from '~/domain';

export interface ReportPreviewPresentation {
  cover: Omit<ReportCoverProps, 'companyLogo'>;
  logoUrl?: string;
  logoAlt: string;
}

export interface ReportPreviewPresentationMetadata {
  reportId?: string;
  issuedDate?: string;
}

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

const toEvidenceText = (
  snapshot: ReportPreviewSnapshot,
  threatId: string,
): string | undefined => {
  if (!snapshot.configuration.includeEvidence) {
    return undefined;
  }

  const evidence = snapshot.selectedEvidence.filter(item =>
    item.threatIds.includes(threatId),
  );

  if (evidence.length === 0) {
    return undefined;
  }

  return evidence
    .map(item => item.content ?? item.description ?? item.title)
    .filter(Boolean)
    .join('\n\n');
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

export const toReportPreviewPresentation = (
  snapshot: ReportPreviewSnapshot,
  metadata: ReportPreviewPresentationMetadata = {},
): ReportPreviewPresentation => {
  const logo = resolveLogo(snapshot);
  const overallRisk = snapshot.riskSummary.overallRisk ?? 'informational';

  return {
    ...logo,
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
      overallRisk,
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
        evidence: toEvidenceText(snapshot, threat.id),
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
