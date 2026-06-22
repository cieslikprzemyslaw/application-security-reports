import { beforeEach, describe, expect, it, vi } from 'vitest';

import { routes } from '~/routes';
import { buildCompany, buildCompanyListItem } from '~/test/builders';
import { clickButton, fillTextbox } from '~/test/interactions';
import { mockApi } from '~/test/mockApi';
import { act, renderRoute, screen, waitFor } from '~/test/render';

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

describe('Create Company failure route', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the form open when company creation fails', async () => {
    const api = mockApi({
      'GET /api/companies': {
        body: {
          data: [],
        },
      },

      'POST /api/companies': {
        status: 500,
        body: createErrorBody('Unable to save company.'),
      },
    });

    const { user } = renderRoute('/companies/new');

    await screen.findByRole('heading', {
      name: 'Create company',
    });

    await fillTextbox(user, 'Company name', 'Northwind Labs');
    await user.upload(getLogoInput(), createLogoFile());
    await clickButton(user, 'Create company');

    expect(
      await screen.findByText('Unable to save company.'),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe('/companies/new');
    expect(api.requestCount('POST /api/companies')).toBe(1);

    expect(api.requests.some(request => request.path.includes('/logo'))).toBe(
      false,
    );

    api.verifyAllHandlersUsed();
  });

  it('guards navigation after the company was created but its logo upload failed', async () => {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000030';

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

    let companyCreated = false;

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

      [`PUT /api/companies/${companyId}/logo`]: {
        status: 500,
        body: createErrorBody('Logo storage unavailable'),
      },
    });

    const confirmMock = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const { user } = renderRoute('/companies/new');

    await screen.findByRole('heading', {
      name: 'Create company',
    });

    await fillTextbox(user, 'Company name', 'Northwind Labs');
    await user.upload(getLogoInput(), createLogoFile());
    await clickButton(user, 'Create company');

    expect(
      await screen.findByText('Company created. Logo upload still pending.'),
    ).toBeInTheDocument();

    expect(screen.getByText(/Logo storage unavailable/)).toBeInTheDocument();

    const beforeUnloadEvent = new Event('beforeunload', {
      cancelable: true,
    });

    act(() => {
      window.dispatchEvent(beforeUnloadEvent);
    });

    expect(beforeUnloadEvent.defaultPrevented).toBe(true);

    await clickButton(user, 'Cancel');

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(1);
    });

    expect(window.location.pathname).toBe('/companies/new');

    await clickButton(user, 'Cancel');

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledTimes(2);
      expect(window.location.pathname).toBe(routes.companies);
    });

    await screen.findByRole('heading', {
      name: 'Companies',
    });

    expect(api.requestCount('POST /api/companies')).toBe(1);
    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(1);

    api.verifyAllHandlersUsed();
  });

  it('keeps the pending logo and retry actions after another upload failure', async () => {
    const companyId = 'cmp_00000000-0000-0000-0000-000000000040';

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

        return {
          status: 500,
          body: createErrorBody(
            logoUploadAttempts === 1
              ? 'Logo storage unavailable'
              : 'Logo storage still unavailable',
          ),
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

    expect(
      await screen.findByText(/Logo storage unavailable/),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('img', {
        name: 'Company logo preview',
      }),
    ).toHaveAttribute('src', 'blob:test-object-url');

    expect(api.requestCount('POST /api/companies')).toBe(1);
    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(1);

    const [retryLogoButton] = screen.getAllByRole('button', {
      name: 'Retry logo upload',
    });

    expect(retryLogoButton).toBeDefined();

    await user.click(retryLogoButton);

    expect(
      await screen.findByText(/Logo storage still unavailable/),
    ).toBeInTheDocument();

    expect(window.location.pathname).toBe('/companies/new');
    expect(api.requestCount('POST /api/companies')).toBe(1);

    expect(api.requestCount(`PUT /api/companies/${companyId}/logo`)).toBe(2);

    expect(
      screen.getAllByRole('button', {
        name: 'Retry logo upload',
      }).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole('button', {
        name: 'Continue without logo',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('img', {
        name: 'Company logo preview',
      }),
    ).toHaveAttribute('src', 'blob:test-object-url');

    api.verifyAllHandlersUsed();
  });
});
