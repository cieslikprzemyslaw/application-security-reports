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

    if (path === '/api/companies/cmp_1/assessments') {
      return createJsonResponse({ data: [] });
    }

    return createJsonResponse({ data: [] });
  });
};
