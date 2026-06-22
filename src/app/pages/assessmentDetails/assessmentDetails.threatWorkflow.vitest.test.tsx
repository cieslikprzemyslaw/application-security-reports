import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { act, waitFor } from '~/test/vitestLegacyBridge';
import { OWASP_TOP_10_CURRENT_VERSION } from '~/domain';
import { routes } from '~/routes';

import {
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './assessmentDetails.threatForm.testUtils';

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
      owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: '2026-06-11T09:00:00.000Z',
      recordVersion: 3,
      findingsCount: 1,
      evidenceCount: 0,
      reportVersionCount: 0,
      testerName: 'Alex Mercer',
      availableActions: ['complete', 'archive'],
    },
  },
};

const threat = {
  id: 'thr_1',
  assessmentId: 'asm_1',
  title: 'Missing object-level authorization',
  description: 'Another customer record can be loaded.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/orders/{id}',
  risk: 'Customer data can be disclosed.',
  recommendation: 'Enforce ownership checks.',
  observation: 'A basic user can load another order.',
  references: 'CWE-639',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-11T09:00:00.000Z',
};

const setupFetch = (
  threatsHandler: (
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

    return threatsHandler(input, init);
  });
};

const unmount = async (root: { unmount: () => void }) => {
  await act(async () => {
    root.unmount();
  });
};

describe('Threat workflow through the production router', () => {
  it('keeps the loading state until the empty Threat collection is confirmed', async () => {
    let resolveThreats: ((response: Response) => void) | undefined;
    const pendingThreats = new Promise<Response>(resolve => {
      resolveThreats = resolve;
    });

    setupFetch(async input => {
      if (String(input) === '/api/threats?assessmentId=asm_1') {
        return pendingThreats;
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      assert.equal(textContent(container).includes('No threats yet'), false);

      await act(async () => {
        resolveThreats?.(createJsonResponse({ data: [] }));
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes('No threats yet'));
        assert.ok(textContent(container).includes('Add threat'));
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a populated Threat collection and opens observable details', async () => {
    setupFetch(async input => {
      if (String(input) === '/api/threats?assessmentId=asm_1') {
        return createJsonResponse({ data: [threat] });
      }

      throw new Error(`Unexpected request: ${String(input)}`);
    });

    try {
      const { container, root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes(threat.title));
        assert.ok(textContent(container).includes(threat.affectedEndpoint));
      });

      const row = Array.from(
        container.querySelectorAll('.data-table-row--clickable'),
      ).find(item => item.textContent?.includes(threat.title)) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(row, 'Expected a clickable Threat row');

      await act(async () => {
        row!.focus();
        row!.dispatchEvent(
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
        assert.ok(textContent(window.document.body).includes('Threat details'));
        assert.ok(textContent(window.document.body).includes('CWE-639'));
      });

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('renders a safe load failure without stale Threat content', async () => {
    setupFetch(async input => {
      if (String(input) === '/api/threats?assessmentId=asm_1') {
        return createJsonResponse(
          {
            error: {
              code: 'THREATS_UNAVAILABLE',
              message: 'Threat collection unavailable.',
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
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes('Unable to load threats'));
        assert.ok(
          textContent(container).includes('Threat collection unavailable.'),
        );
      });

      assert.equal(textContent(container).includes(threat.title), false);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('preserves the confirmed Threat after a delete conflict', async () => {
    let listCalls = 0;

    setupFetch(async (input, init) => {
      const path = String(input);

      if (path === '/api/threats?assessmentId=asm_1') {
        listCalls += 1;
        return createJsonResponse({ data: [threat] });
      }

      if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
        return createJsonResponse(
          {
            error: {
              code: 'THREAT_DELETE_CONFLICT',
              message:
                'Threat cannot be deleted while related evidence or reports exist',
              details: [],
            },
          },
          { status: 409 },
        );
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      await waitFor(() => {
        assert.ok(textContent(container).includes(threat.title));
      });

      Object.defineProperty(window, 'confirm', {
        value: () => true,
        configurable: true,
      });

      const row = Array.from(
        container.querySelectorAll('.data-table-row--clickable'),
      ).find(item => item.textContent?.includes(threat.title)) as
        | HTMLTableRowElement
        | undefined;

      assert.ok(row, 'Expected a clickable Threat row');

      await act(async () => {
        row!.focus();
        row!.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      const deleteButton = Array.from(
        window.document.querySelectorAll('button'),
      ).find(button => button.textContent?.trim() === 'Delete threat');

      assert.ok(deleteButton, 'Expected the delete Threat action');

      await act(async () => {
        deleteButton!.dispatchEvent(
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
        assert.ok(
          textContent(window.document.body).includes('Unable to delete threat'),
        );
        assert.ok(
          textContent(window.document.body).includes(
            'Threat cannot be deleted while related evidence or reports exist',
          ),
        );
      });

      assert.ok(textContent(window.document.body).includes(threat.title));
      assert.equal(listCalls, 1);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });
});
