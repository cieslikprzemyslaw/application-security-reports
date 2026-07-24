import { setFetch, createJsonResponse } from './support';

type AppRouterApiMockRequest = {
  init?: RequestInit;
  method: string;
  path: string;
  url: URL;
};

type AppRouterApiMockRoute = {
  method?: string;
  path: string;
  respond: (request: AppRouterApiMockRequest) => Response | Promise<Response>;
};

const normalizeMockRequest = (
  input: RequestInfo | URL,
  init?: RequestInit,
): AppRouterApiMockRequest => {
  const request = input instanceof Request ? input : undefined;
  const rawUrl =
    input instanceof URL ? input.toString() : request?.url ?? String(input);
  const url = new URL(rawUrl, 'http://localhost');

  return {
    init,
    method: (init?.method ?? request?.method ?? 'GET').toUpperCase(),
    path: `${url.pathname}${url.search}`,
    url,
  };
};

export const setupAppRouterApiMock = (routes: AppRouterApiMockRoute[]) => {
  setFetch(async (input, init) => {
    const request = normalizeMockRequest(input, init);
    const route = routes.find(
      candidate =>
        (candidate.method ?? 'GET').toUpperCase() === request.method &&
        candidate.path === request.path,
    );

    if (!route) {
      throw new Error(
        `Unexpected appRouter API request: ${request.method} ${request.path}`,
      );
    }

    return route.respond(request);
  });
};

const companyListResponse = {
  data: [
    {
      id: 'cmp_1',
      name: 'Northwind Labs',
      website: 'https://northwind.example',
      contactEmail: 'security@northwind.example',
      assessmentCount: 2,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    },
  ],
};

const assessmentListResponse = {
  data: [
    {
      id: 'asm_1',
      companyId: 'cmp_1',
      name: 'Customer Services Portal',
      applicationName: 'Customer Services Portal',
      type: 'Web App',
      status: 'in-progress',
      findingsCount: 14,
      updatedAt: '2026-06-14T10:15:00.000Z',
      description: 'Public customer portal assessment.',
      scope: 'Frontend application and supporting APIs.',
    },
    {
      id: 'asm_5',
      companyId: 'cmp_1',
      name: 'Data Export Service',
      applicationName: 'Data Export Service',
      type: 'API',
      status: 'archived',
      findingsCount: 3,
      updatedAt: '2026-06-13T10:15:00.000Z',
      description: 'Archived API assessment for the export service.',
      scope: 'Data export endpoints and related integrations.',
    },
  ],
};

const activeAssessmentOverviewResponse = {
  data: {
    company: {
      id: 'cmp_1',
      name: 'Northwind Labs',
    },
    assessment: {
      id: 'asm_1',
      companyId: 'cmp_1',
      title: 'Customer Services Portal',
      description: 'Assessment of the customer portal',
      scope: 'Web application',
      status: 'in-progress',
      startedAt: '2026-06-01',
      completedAt: '2026-06-10',
      applicationName: 'Customer Services Portal',
      environment: 'Production',
      assessmentType: 'Web App',
      overallRisk: 'high',
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-11T09:00:00.000Z',
      recordVersion: 3,
      findingsCount: 14,
      evidenceCount: 1,
      reportVersionCount: 2,
      testerName: 'Alex Mercer',
      availableActions: ['complete', 'archive'],
    },
  },
};

const archivedAssessmentOverviewResponse = {
  data: {
    company: {
      id: 'cmp_1',
      name: 'Northwind Labs',
    },
    assessment: {
      id: 'asm_5',
      companyId: 'cmp_1',
      title: 'Data Export Service',
      description: 'Archived assessment for the data export service',
      scope: 'API endpoints for exports and downloads',
      status: 'archived',
      startedAt: '2026-05-20',
      completedAt: '2026-05-22',
      applicationName: 'Data Export Service',
      environment: 'Production',
      assessmentType: 'API',
      overallRisk: 'low',
      createdAt: '2026-05-20T09:00:00.000Z',
      updatedAt: '2026-05-22T09:00:00.000Z',
      recordVersion: 2,
      findingsCount: 3,
      evidenceCount: 0,
      reportVersionCount: 1,
      testerName: 'Jordan Lee',
    },
  },
};

const reportListResponse = {
  data: [
    {
      id: 'rpt_00000000-0000-0000-0000-000000000001',
      assessmentId: 'asm_1',
      title: 'Customer Portal Security Report',
      status: 'draft',
      selectedThreatIds: [],
      latestVersion: 1,
      createdAt: '2026-06-25T10:00:00.000Z',
      updatedAt: '2026-06-25T11:00:00.000Z',
      versions: [
        {
          id: 'rvs_00000000-0000-0000-0000-000000000001',
          version: 1,
          status: 'draft',
          generatedAt: '2026-06-25',
        },
      ],
    },
  ],
};

const missingAssessmentError = {
  error: {
    code: 'ASSESSMENT_NOT_FOUND',
    message: 'Assessment not found',
    details: [],
  },
};

const changedAssessmentError = {
  error: {
    code: 'ASSESSMENT_CHANGED',
    message: 'Assessment changed elsewhere',
    details: [],
  },
};

export const setupAssessmentWorkspaceFetchFixture = () => {
  setupAppRouterApiMock([
    {
      path: '/api/companies',
      respond: () => createJsonResponse(companyListResponse),
    },
    {
      path: '/api/assessments?companyId=cmp_1',
      respond: () => createJsonResponse(assessmentListResponse),
    },
    {
      path: '/api/companies/cmp_1/assessments/asm_1/overview',
      respond: () => createJsonResponse(activeAssessmentOverviewResponse),
    },
    {
      path: '/api/companies/cmp_1/assessments/asm_5/overview',
      respond: () => createJsonResponse(archivedAssessmentOverviewResponse),
    },
    {
      path: '/api/reports?assessmentId=asm_1',
      respond: () => createJsonResponse(reportListResponse),
    },
    {
      path: '/api/companies/cmp_1/assessments/asm_missing/overview',
      respond: () =>
        createJsonResponse(missingAssessmentError, {
          status: 404,
        }),
    },
    {
      path: '/api/companies/cmp_1/assessments/asm_missing',
      respond: () =>
        createJsonResponse(missingAssessmentError, {
          status: 404,
        }),
    },
    {
      method: 'POST',
      path: '/api/companies/cmp_1/assessments/asm_1/commands/complete',
      respond: () =>
        createJsonResponse(changedAssessmentError, {
          status: 409,
        }),
    },
  ]);
};
