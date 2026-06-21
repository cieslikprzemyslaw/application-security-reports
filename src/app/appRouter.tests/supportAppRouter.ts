import { setFetch, createJsonResponse } from './support';

export const setupAssessmentWorkspaceFetchFixture = () => {
  setFetch(async input => {
    const path = String(input);

    if (path === '/api/companies') {
      return createJsonResponse({
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
      });
    }

    if (path === '/api/assessments?companyId=cmp_1') {
      return createJsonResponse({
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
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
      return createJsonResponse({
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
      });
    }

    if (path === '/api/companies/cmp_1/assessments/asm_5/overview') {
      return createJsonResponse({
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
      });
    }

    if (
      path === '/api/companies/cmp_1/assessments/asm_missing/overview' ||
      path === '/api/companies/cmp_1/assessments/asm_missing'
    ) {
      return createJsonResponse(
        {
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            details: [],
          },
        },
        { status: 404 },
      );
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/commands/complete') {
      return createJsonResponse(
        {
          error: {
            code: 'ASSESSMENT_CHANGED',
            message: 'Assessment changed elsewhere',
            details: [],
          },
        },
        { status: 409 },
      );
    }

    throw new Error(`Unexpected request: ${path}`);
  });
};
