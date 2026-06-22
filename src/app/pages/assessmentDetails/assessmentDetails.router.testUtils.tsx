import assert from 'node:assert/strict';

import { ThemeProvider } from 'styled-components';

import AppRouter from '~/app/appRouter';
import {
  act,
  createTestDom,
  createTestingLibraryRoot,
} from '~/test/vitestLegacyBridge';
import { defaultTheme } from '~/theme';

export const renderTick = () =>
  new Promise<void>(resolve => setTimeout(resolve, 0));

const originalFetch = globalThis.fetch;

export const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

export const restoreFetch = () => setFetch(originalFetch);

export const createJsonResponse = (
  body: unknown,
  init: ResponseInit = {},
): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

export const renderApp = async (pathname: string) => {
  const { window } = createTestDom(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: `http://localhost${pathname}` },
  );

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value:
      window.requestAnimationFrame?.bind(window) ??
      ((callback: FrameRequestCallback) => window.setTimeout(callback, 16)),
  });

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value:
      window.cancelAnimationFrame?.bind(window) ??
      window.clearTimeout.bind(window),
  });

  const container = window.document.getElementById('root');

  assert.ok(container, 'Expected root container to exist');

  const root = createTestingLibraryRoot(container);

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

export const textContent = (container: HTMLElement) =>
  container.textContent ?? '';

export const companyResponse = {
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

export const createAssessmentOverviewResponse = (
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

export const createEvidenceResponse = (id: string) => ({
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
