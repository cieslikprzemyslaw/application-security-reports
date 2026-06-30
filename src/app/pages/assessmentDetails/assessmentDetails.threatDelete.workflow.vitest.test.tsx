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

const getRowDeleteButton = (container: ParentNode) =>
  Array.from(container.querySelectorAll('button')).find(
    button => button.textContent?.trim() === 'Delete threat',
  ) as HTMLButtonElement | undefined;

const getFindingsCount = (container: ParentNode) =>
  container.querySelector('#findings-tab .tabs-tab-count')?.textContent?.trim();

describe('Threat delete workflow through the production router', () => {
  it('cancels a row delete without calling the API or changing the count', async () => {
    let deleteCalls = 0;
    const confirmMessages: string[] = [];

    setupFetch(async (input, init) => {
      const path = String(input);

      if (path === '/api/threats?assessmentId=asm_1') {
        return createJsonResponse({ data: [threat] });
      }

      if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
        deleteCalls += 1;
        return new Response(null, { status: 204 });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      Object.defineProperty(window, 'confirm', {
        value: (message?: string) => {
          confirmMessages.push(String(message));
          return false;
        },
        configurable: true,
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes(threat.title));
      });

      const deleteButton = getRowDeleteButton(container);

      assert.ok(deleteButton, 'Expected the row delete Threat action');

      await act(async () => {
        deleteButton!.focus();
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

      assert.deepEqual(confirmMessages, [
        `Delete "${threat.title}"? This action cannot be undone.`,
      ]);
      assert.equal(deleteCalls, 0);
      assert.equal(getFindingsCount(container), '1');
      assert.ok(textContent(container).includes(threat.title));
      assert.equal(window.document.activeElement, deleteButton);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('deletes a Threat from the row action and refreshes the list and tab count', async () => {
    let isDeleted = false;
    let listCalls = 0;
    let deleteCalls = 0;
    const confirmMessages: string[] = [];

    setupFetch(async (input, init) => {
      const path = String(input);

      if (path === '/api/threats?assessmentId=asm_1') {
        listCalls += 1;
        return createJsonResponse({ data: isDeleted ? [] : [threat] });
      }

      if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
        deleteCalls += 1;
        isDeleted = true;
        return new Response(null, { status: 204 });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { container, root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      Object.defineProperty(window, 'confirm', {
        value: (message?: string) => {
          confirmMessages.push(String(message));
          return true;
        },
        configurable: true,
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes(threat.title));
        assert.equal(getFindingsCount(container), '1');
      });

      const deleteButton = getRowDeleteButton(container);

      assert.ok(deleteButton, 'Expected the row delete Threat action');

      await act(async () => {
        deleteButton!.focus();
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
        assert.ok(textContent(container).includes('No threats yet'));
        assert.equal(getFindingsCount(container), '0');
      });

      const focusTarget = container.querySelector(
        '[data-threat-delete-success-focus="true"]',
      ) as HTMLButtonElement | null;

      await waitFor(() => {
        assert.equal(window.document.activeElement, focusTarget);
      });

      assert.deepEqual(confirmMessages, [
        `Delete "${threat.title}"? This action cannot be undone.`,
      ]);
      assert.equal(deleteCalls, 1);
      assert.equal(listCalls, 2);

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });

  it('preserves the Threat, count and focus after a row delete failure', async () => {
    let listCalls = 0;
    let deleteCalls = 0;

    setupFetch(async (input, init) => {
      const path = String(input);

      if (path === '/api/threats?assessmentId=asm_1') {
        listCalls += 1;
        return createJsonResponse({ data: [threat] });
      }

      if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
        deleteCalls += 1;
        return createJsonResponse(
          {
            error: {
              code: 'THREAT_DELETE_CONFLICT',
              message: 'Threat cannot be deleted while evidence is linked.',
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

      Object.defineProperty(window, 'confirm', {
        value: () => true,
        configurable: true,
      });

      await waitFor(() => {
        assert.ok(textContent(container).includes(threat.title));
      });

      const deleteButton = getRowDeleteButton(container);

      assert.ok(deleteButton, 'Expected the row delete Threat action');

      await act(async () => {
        deleteButton!.focus();
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
        assert.ok(textContent(container).includes('Unable to delete threat'));
        assert.ok(
          textContent(container).includes(
            'Threat cannot be deleted while evidence is linked.',
          ),
        );
      });

      assert.ok(textContent(container).includes(threat.title));
      assert.equal(getFindingsCount(container), '1');
      assert.equal(deleteCalls, 1);
      assert.equal(listCalls, 1);
      assert.equal(
        window.document.activeElement?.textContent?.trim(),
        'Delete threat',
      );

      await unmount(root);
    } finally {
      restoreFetch();
    }
  });
});
