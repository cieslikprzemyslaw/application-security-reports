import assert from 'node:assert/strict';

import { act } from 'react';

import { routes } from '~/routes';
import { OWASP_TOP_10_CURRENT_VERSION } from '~/domain';
import {
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
} from './assessmentDetails.threatForm.testUtils';

const makeThreat = (id: string) => ({
  id,
  assessmentId: 'asm_1',
  title: `Threat ${id}`,
  description: 'A threat description.',
  severity: 'medium',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-10T09:00:00.000Z',
});

const makeOverview = (findingsCount: number) => ({
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
    findingsCount,
    evidenceCount: 0,
    reportVersionCount: 0,
    testerName: 'Alex Mercer',
    availableActions: ['complete', 'archive'],
  },
});

const companiesData = [
  {
    id: 'cmp_1',
    name: 'Northwind Labs',
    website: 'https://northwind.example',
    contactEmail: 'security@northwind.example',
    assessmentCount: 1,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
];

const findingsTabCount = (window: { document: Document }): string | null =>
  window.document.querySelector('#findings-tab .tabs-tab-count')?.textContent ??
  null;

await (async () => {
  try {
    // Delete success — Findings tab count decrements
    {
      let threatsCallCount = 0;

      setFetch(async (input, init) => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse({ data: companiesData });
        }

        if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
          return createJsonResponse({ data: makeOverview(2) });
        }

        if (path === '/api/threats?assessmentId=asm_1') {
          threatsCallCount++;
          return createJsonResponse({
            data:
              threatsCallCount === 1
                ? [makeThreat('thr_1'), makeThreat('thr_2')]
                : [makeThreat('thr_2')],
          });
        }

        if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
          return new Response(null, { status: 204 });
        }

        throw new Error(`Unexpected request: ${path} ${init?.method ?? 'GET'}`);
      });

      const { root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      assert.equal(
        findingsTabCount(window),
        '2',
        'Expected initial Findings tab count 2',
      );

      Object.defineProperty(window, 'confirm', {
        value: () => true,
        configurable: true,
        writable: true,
      });

      const firstRow = window.document.querySelector(
        '.data-table-row--clickable',
      ) as HTMLElement | null;
      assert.ok(firstRow, 'Expected a clickable table row');

      await act(async () => {
        firstRow!.dispatchEvent(
          new window.MouseEvent('click', { bubbles: true, cancelable: true }),
        );
        await renderTick();
        await renderTick();
      });

      const deleteButton = Array.from(
        window.document.querySelectorAll('button'),
      ).find(b => b.textContent?.trim() === 'Delete threat') as
        | HTMLButtonElement
        | undefined;
      assert.ok(
        deleteButton,
        'Expected a Delete threat button in the view drawer',
      );

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

      assert.equal(
        findingsTabCount(window),
        '1',
        'Expected Findings tab count to decrement to 1 after successful delete',
      );

      await act(async () => {
        root.unmount();
      });
    }

    // Delete failure — Findings tab count unchanged
    {
      setFetch(async (input, init) => {
        const path = String(input);

        if (path === '/api/companies') {
          return createJsonResponse({ data: companiesData });
        }

        if (path === '/api/companies/cmp_1/assessments/asm_1/overview') {
          return createJsonResponse({ data: makeOverview(2) });
        }

        if (path === '/api/threats?assessmentId=asm_1') {
          return createJsonResponse({
            data: [makeThreat('thr_1'), makeThreat('thr_2')],
          });
        }

        if (path === '/api/threats/thr_1' && init?.method === 'DELETE') {
          return createJsonResponse(
            { error: { code: 'INTERNAL_ERROR', message: 'Server error' } },
            { status: 500 },
          );
        }

        throw new Error(`Unexpected request: ${path} ${init?.method ?? 'GET'}`);
      });

      const { root, window } = await renderApp(
        routes.assessmentDetailsFindings('cmp_1', 'asm_1'),
      );

      assert.equal(
        findingsTabCount(window),
        '2',
        'Expected initial Findings tab count 2',
      );

      Object.defineProperty(window, 'confirm', {
        value: () => true,
        configurable: true,
        writable: true,
      });

      const firstRow = window.document.querySelector(
        '.data-table-row--clickable',
      ) as HTMLElement | null;
      assert.ok(firstRow, 'Expected a clickable table row');

      await act(async () => {
        firstRow!.dispatchEvent(
          new window.MouseEvent('click', { bubbles: true, cancelable: true }),
        );
        await renderTick();
        await renderTick();
      });

      const deleteButton = Array.from(
        window.document.querySelectorAll('button'),
      ).find(b => b.textContent?.trim() === 'Delete threat') as
        | HTMLButtonElement
        | undefined;
      assert.ok(
        deleteButton,
        'Expected a Delete threat button in the view drawer',
      );

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

      assert.equal(
        findingsTabCount(window),
        '2',
        'Expected Findings tab count to remain 2 after failed delete',
      );

      await act(async () => {
        root.unmount();
      });
    }

    console.log('assessmentDetails.tabCount delete tests passed');
  } finally {
    restoreFetch();
  }
})();
