import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import AppRouter from '~/app/appRouter';
import { routes } from '~/routes';
import { defaultTheme } from '~/theme';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const originalFetch = globalThis.fetch;

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const restoreFetch = () => {
  setFetch(originalFetch);
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = (pathname: string) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
  );

  const { window } = dom;

  setGlobal('window', window);
  setGlobal('document', window.document);
  setGlobal('navigator', window.navigator);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('Node', window.Node);
  setGlobal(
    'requestAnimationFrame',
    window.requestAnimationFrame?.bind(window) ??
      ((callback: FrameRequestCallback) => window.setTimeout(callback, 16)),
  );
  setGlobal(
    'cancelAnimationFrame',
    window.cancelAnimationFrame?.bind(window) ??
      window.clearTimeout.bind(window),
  );
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

  return {
    container: window.document.getElementById('root'),
  };
};

const renderApp = async (pathname: string) => {
  const { container } = setupDom(pathname);

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <AppRouter />
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

const companyResponse = {
  data: [
    {
      id: 'cmp_1',
      name: 'Northwind Labs',
      website: 'https://northwind.example',
      contactEmail: 'security@northwind.example',
      assessmentCount: 1,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    },
  ],
};

const baseAssessment = {
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
};

const createAssessmentOverviewResponse = (
  assessmentId: string,
  evidenceCount: number,
  applicationName: string | null = baseAssessment.assessment.applicationName,
  overrides: Partial<{
    environment: string | null;
    testerName: string | null;
  }> = {},
) => ({
  data: {
    ...baseAssessment,
    assessment: {
      ...baseAssessment.assessment,
      id: assessmentId,
      evidenceCount,
      applicationName,
      ...overrides,
    },
  },
});

const createEvidenceResponse = (id: string) => ({
  data: [
    {
      id,
      assessmentId: 'asm_1',
      threatIds: ['thr_1'],
      type: 'http',
      title: 'Evidence screenshot',
      description: 'Captured evidence for the assessment',
      content: 'Plain-text evidence',
      fileName: 'evidence.png',
      filePath: `uploads/evidence/${id}/attachment.png`,
      storageKey: `uploads/evidence/${id}/attachment.png`,
      mimeType: 'image/png',
      attachmentSizeBytes: 1234,
      capturedAt: '2026-06-05',
      httpExchanges: [
        {
          request: {
            method: 'GET',
            url: '/api/orders/1',
            body: 'request body',
          },
          response: {
            statusCode: 200,
            statusText: 'OK',
            body: 'response body',
          },
        },
      ],
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:00:00.000Z',
    },
  ],
});

await (async () => {
  try {
    {
      setFetch(async input => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_1', 1),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_1') {
          return createJsonResponse(createEvidenceResponse('evd_1'));
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Assessment ID'));
      assert.ok(textContent(container).includes('Evidence'));
      assert.equal(
        container
          .querySelector(
            '.assessment-summary-metadata-item:nth-child(1) .assessment-summary-metadata-value',
          )
          ?.textContent?.trim(),
        'Production',
      );
      assert.equal(
        container
          .querySelector(
            '.assessment-summary-metadata-item:nth-child(3) .assessment-summary-metadata-value',
          )
          ?.textContent?.trim(),
        'Alex Mercer',
      );

      const evidenceTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Evidence')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(evidenceTab, 'Expected the Evidence tab');

      await act(async () => {
        evidenceTab!.click();
        await renderTick();
        await renderTick();
      });

      assert.ok(textContent(container).includes('Evidence screenshot'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      setFetch(async input => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_null/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_null', 1, null, {
              environment: '   ',
              testerName: '   ',
            }),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_null') {
          return createJsonResponse(createEvidenceResponse('evd_null'));
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_null'),
      );

      assert.equal(
        container
          .querySelector('.assessment-summary-application-name')
          ?.textContent?.trim(),
        '—',
      );
      assert.equal(
        container
          .querySelector(
            '.assessment-summary-metadata-item:nth-child(1) .assessment-summary-metadata-value',
          )
          ?.textContent?.trim(),
        '—',
      );
      assert.equal(
        container
          .querySelector(
            '.assessment-summary-metadata-item:nth-child(3) .assessment-summary-metadata-value',
          )
          ?.textContent?.trim(),
        '—',
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      setFetch(async input => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_empty/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_empty', 0),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_empty') {
          return createJsonResponse({ data: [] });
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_empty'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Assessment ID'));
      assert.ok(textContent(container).includes('Evidence'));

      const evidenceTab = Array.from(
        container.querySelectorAll('[role="tab"]'),
      ).find(button => button.textContent?.startsWith('Evidence')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(evidenceTab, 'Expected the Evidence tab');

      await act(async () => {
        evidenceTab!.click();
        await renderTick();
        await renderTick();
      });

      assert.ok(textContent(container).includes('No evidence yet'));

      await act(async () => {
        root.unmount();
      });
    }

    {
      setFetch(async input => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse(companyResponse);
        }

        if (path === '/api/companies/cmp_1/assessments/asm_error/overview') {
          return createJsonResponse(
            createAssessmentOverviewResponse('asm_error', 1),
          );
        }

        if (path === '/api/evidence?assessmentId=asm_error') {
          throw new Error('Unable to load evidence.');
        }

        throw new Error(`Unexpected request: ${path}`);
      });

      const { container, root } = await renderApp(
        routes.assessmentDetailsEvidence('cmp_1', 'asm_error'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.ok(textContent(container).includes('Assessment ID'));
      assert.ok(textContent(container).includes('Unable to load evidence'));

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
})();
