import {
  act,
  assert,
  assertRouteRenders,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './support';

export const runGlobalRoutesAndSettingsTests = async () => {
  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { container, root } = await renderApp('/assessments');

      assert.equal(window.location.pathname, '/dashboard');
      assert.ok(textContent(container).includes('No companies yet'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { container, root } = await renderApp(
        '/threats?search=Missing&severity=critical&status=open&application=Customer%20Services%20Portal',
      );

      assert.equal(window.location.pathname, '/threats');
      assert.equal(
        new URLSearchParams(window.location.search).get('application'),
        'Customer Services Portal',
      );
      assert.ok(
        textContent(container).includes('Missing Server-Side Authorization'),
      );

      const searchInput = container.querySelector(
        'input[placeholder="Search threats..."]',
      ) as HTMLInputElement | null;

      assert.equal(searchInput?.value, 'Missing');

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { root } = await renderApp(
        '/threats?search=Missing&severity=invalid&status=invalid&application=Nope',
      );

      await act(async () => {
        await renderTick();
      });

      assert.equal(window.location.search, '?search=Missing');

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      await assertRouteRenders(
        '/threats',
        'Security threats across all active assessments.',
      );
    } finally {
      restoreFetch();
    }
  }

  await assertRouteRenders('/reports', 'Report Preview');

  {
    setFetch(async input => {
      assert.equal(String(input), '/api/settings');

      return createJsonResponse({
        data: {
          id: 'set_00000000-0000-0000-0000-000000000001',
          organisationName: 'Northstar Digital',
          consultantName: 'Alex Mercer',
          consultantEmail: 'alex.mercer@appsec.io',
          issuerLogoId: null,
          defaultReportTitle: 'Application Security Assessment',
          defaultSeverity: 'medium',
          theme: 'system',
          dateFormat: 'YYYY-MM-DD',
          reportFooterText:
            '(c) 2026 Northstar Digital. Confidential - do not distribute.',
          reportConfidentialityLabel: 'Confidential',
          methodology: 'OWASP ASVS / WSTG',
          reportStyle: 'Technical & structured',
          includeEvidence: true,
          confidentialReports: true,
          allowedBrandingModes: ['issuer', 'client'],
          defaultBrandingMode: 'issuer',
          createdAt: '2026-06-01T09:00:00.000Z',
          updatedAt: '2026-06-11T09:00:00.000Z',
        },
      });
    });

    try {
      const { container, root } = await renderApp('/settings');

      assert.ok(
        textContent(container).includes(
          'Manage organisation details, report branding, defaults, and user preferences.',
        ),
      );
      assert.ok(
        !textContent(container).includes('Something went wrong'),
        'Expected the settings route to avoid the route error boundary',
      );
      assert.ok(container.querySelector('.settings-form'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }
};
