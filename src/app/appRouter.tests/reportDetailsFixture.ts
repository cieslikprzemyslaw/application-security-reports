import type { CompanyListItem, ReportVersionResponse } from '~/domain';
import { previewSnapshot } from '~/app/pages/reports/reportPreview.testFixtures';

import { createJsonResponse, setFetch } from './support';

export const reportDetailsCompanyId = previewSnapshot.company.id;
export const reportDetailsReportId = 'rpt_00000000-0000-0000-0000-000000000029';
export const missingReportId = 'rpt_00000000-0000-0000-0000-000000000999';
export const oldReportVersionId = 'rvs_00000000-0000-0000-0000-000000000029';
export const latestReportVersionId = 'rvs_00000000-0000-0000-0000-000000000030';

const reportDetailsCompany: CompanyListItem = {
  id: reportDetailsCompanyId,
  name: previewSnapshot.company.name,
  website: previewSnapshot.company.website,
  contactEmail: previewSnapshot.company.contactEmail,
  logoUrl: previewSnapshot.company.logoUrl ?? null,
  archivedAt: null,
  assessmentCount: 1,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-25T00:00:00.000Z',
};

const oldSnapshot = {
  ...previewSnapshot,
  assessment: {
    ...previewSnapshot.assessment,
    title: '<img src=x onerror=alert(1)>',
    applicationName: '<img src=x onerror=alert(1)>',
  },
  branding: {
    ...previewSnapshot.branding,
    brandingMode: 'none' as const,
    companyLogoUrl: null,
    issuerLogoUrl: null,
  },
  warnings: ['Saved attachment is no longer available.'],
};

const highThreat = {
  ...previewSnapshot.selectedThreats[0],
  id: 'thr_00000000-0000-0000-0000-000000000002',
  title: 'Stored High Severity Threat',
  severity: 'high' as const,
  status: 'mitigated' as const,
  evidenceCount: 0,
};

const lowThreat = {
  ...previewSnapshot.selectedThreats[0],
  id: 'thr_00000000-0000-0000-0000-000000000003',
  title: 'Stored Low Severity Threat',
  severity: 'low' as const,
  status: 'resolved' as const,
  evidenceCount: 0,
};

const latestSnapshot = {
  ...previewSnapshot,
  assessment: {
    ...previewSnapshot.assessment,
    title: 'Current Customer Portal',
    applicationName: 'Current Customer Portal',
  },
  configuration: {
    methodology: previewSnapshot.configuration.methodology,
    reportStyle: previewSnapshot.configuration.reportStyle,
  },
  selection: {
    ...previewSnapshot.selection,
    threatIds: [
      previewSnapshot.selectedThreats[0].id,
      highThreat.id,
      lowThreat.id,
    ],
  },
  selectedThreats: [previewSnapshot.selectedThreats[0], highThreat, lowThreat],
  riskSummary: {
    ...previewSnapshot.riskSummary,
    threatCount: 3,
  },
};

export const oldReportVersion: ReportVersionResponse = {
  id: oldReportVersionId,
  reportId: reportDetailsReportId,
  version: 10,
  status: 'final',
  generatedAt: '2026-05-30',
  snapshot: oldSnapshot,
};

export const latestReportVersion: ReportVersionResponse = {
  id: latestReportVersionId,
  reportId: reportDetailsReportId,
  version: 11,
  status: 'draft',
  generatedAt: '2026-06-25',
  snapshot: latestSnapshot,
};

interface ReportDetailsFetchFixtureOptions {
  emptyVersions?: boolean;
  failVersions?: boolean;
}

export const setupReportDetailsFetchFixture = (
  options: ReportDetailsFetchFixtureOptions = {},
) => {
  const calls: string[] = [];

  setFetch(async input => {
    const path = String(input);
    calls.push(path);

    if (path === '/api/companies') {
      return createJsonResponse({ data: [reportDetailsCompany] });
    }

    if (path === `/api/reports/${reportDetailsReportId}/versions`) {
      if (options.failVersions) {
        return createJsonResponse(
          {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Unexpected server error',
              details: [],
            },
          },
          { status: 500 },
        );
      }

      return createJsonResponse({
        data: options.emptyVersions
          ? []
          : [oldReportVersion, latestReportVersion],
      });
    }

    if (
      path ===
      `/api/reports/${reportDetailsReportId}/versions/${oldReportVersionId}`
    ) {
      return createJsonResponse({ data: oldReportVersion });
    }

    if (
      path ===
      `/api/reports/${reportDetailsReportId}/versions/${latestReportVersionId}`
    ) {
      return createJsonResponse({ data: latestReportVersion });
    }

    if (path === `/api/reports/${missingReportId}/versions`) {
      return createJsonResponse(
        {
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Report not found',
            details: [],
          },
        },
        { status: 404 },
      );
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  return calls;
};
