import { beforeEach, describe, expect, it } from 'vitest';

import { routes } from '~/routes';
import { buildCompany, buildCompanyListItem } from '~/test/builders';
import { clickButton, fillTextbox } from '~/test/interactions';
import { mockApi } from '~/test/mockApi';
import { renderRoute, screen, waitFor } from '~/test/render';

const createErrorBody = (message: string) => ({
  error: {
    code: 'REQUEST_FAILED',
    message,
    details: [],
  },
});

const getLogoInput = () => {
  const input = document.querySelector<HTMLInputElement>('#company-logo');

  expect(input).not.toBeNull();

  return input!;
};

const createLogoFile = () =>
  new File(['fake-png'], 'logo.png', {
    type: 'image/png',
  });

describe('Create Company success route', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates the first company, uploads its logo and opens its workspace', async () => {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000010';

    const createdCompany = buildCompany({
      id: companyId,
      name: 'Northwind Labs',
      description: 'Cloud security partner',
      website: 'https://northwind.example',
      contactName: 'A. Example',
      contactEmail: 'security@northwind.example',
      logoUrl: null,
      footerText: 'Confidential',
    });

    const companyWithLogo = buildCompany({
      ...createdCompany,
      logoUrl: `http://localhost/api/companies/${companyId}/logo`,
    });

    const api = mockApi({
      'GET /api/companies': {
        body: {
          data: [],
        },
      },

      'POST /api/companies': {
        status: 201,
        body: {
          data: createdCompany,
        },
      },

      [`PUT /api/companies/${companyId}/logo`]: {
        body: {
          data: companyWithLogo,
        },
      },

      [`GET /api/companies/${companyId}/overview`]: {
        body: {
          data: {
            company: companyWithLogo,
            assessmentCounts: {
              total: 0,
              draft: 0,
              inProgress: 0,
              completed: 0,
            },
            recentAssessments: [],
          },
        },
      },
    });

    const { user } = renderRoute('/companies/new');

    await screen.findByRole('heading', {
      name: 'Create company',
    });

    await fillTextbox(user, 'Company name', 'Northwind Labs');
    await user.upload(getLogoInput(), createLogoFile());
    await clickButton(user, 'Create company');

    await waitFor(() => {
      expect(window.location.pathname).toBe(
        routes.companyWorkspaceOverview(companyId),
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('Northwind Labs').length).toBeGreaterThan(0);
    });

    expect(api.requestCount('POST /api/companies')).toBe(1);
    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(1);

    expect(api.request('POST /api/companies').json()).toEqual({
      name: 'Northwind Labs',
    });

    expect(
      api
        .request(`PUT /api/companies/${companyId}/logo`)
        .headers.get('X-File-Name'),
    ).toBe('logo.png');

    await waitFor(() => {
      expect(api.requestCount(`GET /api/companies/${companyId}/overview`)).toBe(
        1,
      );
    });
    api.verifyAllHandlersUsed();
  }, 15_000);

  it('keeps the created company and retries a failed logo upload without creating it again', async () => {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000020';

    const existingCompany = buildCompanyListItem({
      id: 'cmp_00000000-0000-0000-0000-000000000001',
      name: 'Existing Company',
      assessmentCount: 1,
    });

    const createdCompany = buildCompany({
      id: companyId,
      name: 'Northwind Labs',
      logoUrl: null,
    });

    const companyWithLogo = buildCompany({
      ...createdCompany,
      logoUrl: `http://localhost/api/companies/${companyId}/logo`,
    });

    let companyCreated = false;
    let logoUploadAttempts = 0;

    const api = mockApi({
      'GET /api/companies': () => ({
        body: {
          data: [
            existingCompany,
            ...(companyCreated
              ? [
                  buildCompanyListItem({
                    ...createdCompany,
                    assessmentCount: 0,
                  }),
                ]
              : []),
          ],
        },
      }),

      'POST /api/companies': () => {
        companyCreated = true;

        return {
          status: 201,
          body: {
            data: createdCompany,
          },
        };
      },

      [`PUT /api/companies/${companyId}/logo`]: () => {
        logoUploadAttempts += 1;

        if (logoUploadAttempts === 1) {
          return {
            status: 500,
            body: createErrorBody('Logo storage unavailable'),
          };
        }

        return {
          body: {
            data: companyWithLogo,
          },
        };
      },
    });

    const { user } = renderRoute('/companies/new');

    await screen.findByRole('heading', {
      name: 'Create company',
    });

    await fillTextbox(user, 'Company name', 'Northwind Labs');
    await user.upload(getLogoInput(), createLogoFile());
    await clickButton(user, 'Create company');

    expect(window.location.pathname).toBe('/companies/new');

    expect(
      await screen.findByText('Company created. Logo upload still pending.'),
    ).toBeInTheDocument();

    expect(screen.getByText(/Logo storage unavailable/)).toBeInTheDocument();

    expect(api.requestCount('POST /api/companies')).toBe(1);
    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(1);

    const [retryLogoButton] = screen.getAllByRole('button', {
      name: 'Retry logo upload',
    });

    expect(retryLogoButton).toBeDefined();

    await user.click(retryLogoButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe(routes.companies);
    });

    await screen.findByRole('heading', {
      name: 'Companies',
    });

    expect(api.requestCount('POST /api/companies')).toBe(1);
    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(2);

    api.verifyAllHandlersUsed();
  });
});
