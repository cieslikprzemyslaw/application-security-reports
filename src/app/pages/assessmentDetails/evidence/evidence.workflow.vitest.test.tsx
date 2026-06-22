import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  textContent,
  waitFor,
} from '~/app/appRouter.tests/support';

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

const overviewResponse = {
  data: {
    company: { id: 'cmp_1', name: 'Northwind Labs' },
    assessment: {
      id: 'asm_1',
      companyId: 'cmp_1',
      title: 'Customer Services Portal',
      status: 'in-progress',
      applicationName: 'Customer Services Portal',
      environment: 'Production',
      assessmentType: 'Web App',
      overallRisk: 'high',
      owaspTaxonomyVersion: '2025',
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-11T09:00:00.000Z',
      recordVersion: 3,
      findingsCount: 1,
      evidenceCount: 1,
      reportVersionCount: 0,
      testerName: 'Alex Mercer',
      availableActions: ['complete', 'archive'],
    },
  },
};

const evidence = {
  id: 'evd_1',
  assessmentId: 'asm_1',
  threatIds: [],
  type: 'note',
  title: 'Authorization reproduction',
  description: 'Observed request and response details.',
  content: 'GET /api/orders/2',
  capturedAt: '2026-06-22',
  createdAt: '2026-06-22T09:00:00.000Z',
  updatedAt: '2026-06-22T09:00:00.000Z',
};

const setupFetch = (
  evidenceHandler: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => {
  setFetch(async (input, init) => {
    const path = String(input);

    if (path === '/api/companies') {
      return createJsonResponse(companyResponse);
    }

    if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
      return createJsonResponse(overviewResponse);
    }

    if (path === '/api/threats?assessmentId=asm_1') {
      return createJsonResponse({ data: [] });
    }

    return evidenceHandler(input, init);
  });
};

const unmount = async (root: { unmount: () => void }) => {
  await act(async () => {
    root.unmount();
  });
};

describe('Evidence workflow through the production router', () => {
  it('shows loading before the empty Evidence collection is confirmed', async () => {
    let resolveEvidence: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>(resolve => {
      resolveEvidence = resolve;
    });

    setupFetch(async input => {
      if (String(input) === '/api/evidence?assessmentId=asm_1') {
        return pending;
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
        false,
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Loading evidence'));
      });

      await act(async () => {
        resolveEvidence?.(createJsonResponse({ data: [] }));
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('No evidence yet'));
        assert.ok(textContent(container).includes('Add evidence'));
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders populated Evidence and opens the latest detail through routing composition', async () => {
    setupFetch(async input => {
      const path = String(input);

      if (path === '/api/evidence?assessmentId=asm_1') {
        return createJsonResponse({ data: [evidence] });
      }

      if (path === '/api/evidence/evd_1') {
        return createJsonResponse({ data: evidence });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes(evidence.title));
      });

      const titleButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.trim() === evidence.title,
      );

      assert.ok(titleButton, 'Expected Evidence detail action');

      await act(async () => {
        titleButton!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(document.body).includes('GET /api/orders/2'));
        assert.ok(textContent(document.body).includes('Edit evidence'));
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a safe load failure without stale Evidence content', async () => {
    setupFetch(async input => {
      if (String(input) === '/api/evidence?assessmentId=asm_1') {
        return createJsonResponse(
          {
            error: {
              code: 'EVIDENCE_UNAVAILABLE',
              message: 'Evidence collection unavailable.',
              details: [],
            },
          },
          { status: 500 },
        );
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.assessmentDetailsEvidence('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Unable to load evidence'));
        assert.ok(
          textContent(container).includes('Evidence collection unavailable.'),
        );
        assert.ok(
          Array.from(container.querySelectorAll('button')).some(button =>
            button.textContent?.includes('Retry'),
          ),
        );
      });

      assert.equal(textContent(container).includes(evidence.title), false);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });
});
