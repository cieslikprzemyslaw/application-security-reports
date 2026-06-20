import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import type { GlobalThreatRow } from '~/app/components/appsec/globalThreatTable';
import Dashboard from '~/app/pages/dashboard';
import Companies from '~/app/pages/companies';
import Assessments from '~/app/pages/assessments';
import Threats from '~/app/pages/threats';
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

const setupDom = (localStorageEntries?: Record<string, string>) => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/' },
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

  if (localStorageEntries) {
    for (const [key, value] of Object.entries(localStorageEntries)) {
      window.localStorage.setItem(key, value);
    }
  }

  const container = window.document.getElementById('root');

  assert.ok(container, 'Expected root container to exist');

  return { container };
};

const renderComponent = async (
  element: React.ReactNode,
  localStorageEntries?: Record<string, string>,
  initialEntry = '/',
) => {
  const { container } = setupDom(localStorageEntries);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <MemoryRouter initialEntries={[initialEntry]}>{element}</MemoryRouter>
      </ThemeProvider>,
    );
    await renderTick();
    await renderTick();
  });

  return { container, root };
};

const textContent = (container: HTMLElement) => container.textContent ?? '';

const sampleThreat: GlobalThreatRow = {
  id: 'thr_1',
  title: 'Stored XSS in comment body',
  applicationName: 'Northwind Portal',
  companyName: 'Northwind Labs',
  strideCategory: 'tampering',
  severity: 'high',
  status: 'open',
  updatedAt: '2026-06-14',
};

await (async () => {
  {
    setFetch(async input => {
      assert.equal(String(input), '/api/companies');
      return createJsonResponse({ data: [] });
    });

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      assert.ok(textContent(container).includes('No companies yet'));
      assert.ok(textContent(container).includes('New company'));
      assert.ok(
        container.querySelector('[role="status"]'),
        'Expected the empty state to announce itself politely',
      );

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
      return createJsonResponse({
        data: [
          {
            id: 'cmp_1',
            name: 'Northwind Labs',
            description: 'Cloud security partner',
            website: 'https://northwind.example',
            contactName: 'A. Example',
            contactEmail: 'security@northwind.example',
            logoUrl: null,
            footerText: 'Confidential',
            assessmentCount: 2,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-10T00:00:00.000Z',
          },
        ],
      });
    });

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const searchInput = container.querySelector(
        'input[placeholder="Search companies..."]',
      ) as HTMLInputElement | null;

      assert.ok(searchInput, 'Expected the companies search input');

      await act(async () => {
        searchInput!.value = 'zebra';
        searchInput?.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('No companies match "zebra"'));
      assert.ok(textContent(container).includes('Clear search'));

      const clearButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Clear search'),
      );

      assert.ok(clearButton, 'Expected a clear search action');

      await act(async () => {
        clearButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.equal(searchInput?.value, '');

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const validationPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            path: 'name',
            message: 'Text is required',
          },
        ],
      },
    };

    let requestCount = 0;

    setFetch(async input => {
      requestCount += 1;

      if (requestCount === 1) {
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

      if (String(input) === '/api/companies' && requestCount === 2) {
        return createJsonResponse(validationPayload, { status: 400 });
      }

      return createJsonResponse({
        data: {
          id: 'cmp_2',
          name: 'Northwind Labs',
          website: 'https://northwind.example',
          contactEmail: 'security@northwind.example',
          assessmentCount: 2,
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-10T00:00:00.000Z',
        },
      });
    });

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const newCompanyButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('New company'));

      assert.ok(newCompanyButton, 'Expected a new company action');

      await act(async () => {
        newCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Create company'));

      const nameInput = window.document.querySelector(
        'input#company-name',
      ) as HTMLInputElement | null;

      assert.ok(nameInput, 'Expected the company name field');

      await act(async () => {
        nameInput!.value = 'Northwind Labs';
        nameInput!.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
      });

      const createButton = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;

      assert.ok(createButton, 'Expected a create company submit action');

      await act(async () => {
        createButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Could not save company'));
      assert.ok(textContent(container).includes('Text is required'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
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
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const newCompanyButton = Array.from(
        container.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('New company'));

      assert.ok(newCompanyButton, 'Expected a new company action');

      await act(async () => {
        newCompanyButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
        await renderTick();
      });

      const nameInput = window.document.querySelector(
        'input#company-name',
      ) as HTMLInputElement | null;

      assert.ok(nameInput, 'Expected the company name field');
      assert.equal(
        window.document.activeElement,
        nameInput,
        'Expected the name field to keep focus after the drawer opens',
      );

      await act(async () => {
        nameInput!.value = 'Northwind Labs';
        nameInput!.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
      });

      assert.equal(
        window.document.activeElement,
        nameInput,
        'Expected typing to keep focus in the company name field',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
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
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Companies
          activeCompany={{ id: 'cmp_1', name: 'Northwind Labs' }}
          onActiveCompanyChange={() => undefined}
        />,
      );

      const companyRow = Array.from(
        container.querySelectorAll('.company-table__row'),
      )[0] as HTMLTableRowElement | undefined;

      assert.ok(companyRow, 'Expected a company row');

      await act(async () => {
        companyRow.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.ok(textContent(container).includes('Edit company'));
      assert.equal(
        (
          window.document.querySelector(
            'input#company-name',
          ) as HTMLInputElement
        )?.value,
        'Northwind Labs',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [],
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Assessments companyId="cmp_1" companyName="Northstar Digital" />,
      );

      assert.ok(textContent(container).includes('No assessments yet'));
      assert.ok(textContent(container).includes('New assessment'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse({
        data: [
          {
            id: 'asm_1',
            name: 'Northwind Portal',
            type: 'Web App',
            status: 'draft',
            findingsCount: 7,
            updatedAt: '2026-06-14T10:15:00.000Z',
            description: 'Assessment of the customer portal',
            scope: 'Web application',
          },
        ],
      }),
    );

    try {
      const { container, root } = await renderComponent(
        <Assessments companyId="cmp_1" companyName="Northstar Digital" />,
      );

      assert.ok(textContent(container).includes('Northwind Portal'));
      assert.ok(textContent(container).includes('Findings'));
      assert.ok(textContent(container).includes('Updated'));

      const searchInput = container.querySelector(
        'input[placeholder="Search assessments..."]',
      ) as HTMLInputElement | null;

      assert.ok(searchInput, 'Expected the assessments search input');

      await act(async () => {
        searchInput!.value = 'missing';
        searchInput?.dispatchEvent(
          new window.Event('input', {
            bubbles: true,
            cancelable: true,
          }),
        );
        await renderTick();
      });

      assert.ok(
        textContent(container).includes(
          'No assessments match your current search and filters',
        ),
      );
      assert.ok(textContent(container).includes('Clear filters'));

      const clearButton = Array.from(container.querySelectorAll('button')).find(
        button => button.textContent?.includes('Clear filters'),
      );

      assert.ok(clearButton, 'Expected a clear filters action');

      await act(async () => {
        clearButton.dispatchEvent(
          new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
        await renderTick();
      });

      assert.equal(searchInput?.value, '');

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  }

  {
    const { container, root } = await renderComponent(
      <Threats
        threats={[]}
        searchValue=""
        severityFilter="all"
        statusFilter="all"
        applicationFilter="all"
        selectedThreat={undefined}
        isDrawerOpen={false}
        onSearchChange={() => undefined}
        onSeverityFilterChange={() => undefined}
        onStatusFilterChange={() => undefined}
        onApplicationFilterChange={() => undefined}
        onThreatClick={() => undefined}
        onDrawerClose={() => undefined}
      />,
    );

    assert.ok(textContent(container).includes('No threats yet'));

    await act(async () => {
      root.unmount();
    });
  }

  {
    const updates: string[] = [];

    const { container, root } = await renderComponent(
      <Threats
        threats={[sampleThreat]}
        searchValue="missing"
        severityFilter="high"
        statusFilter="all"
        applicationFilter="all"
        selectedThreat={undefined}
        isDrawerOpen={false}
        onSearchChange={value => updates.push(`search:${value}`)}
        onSeverityFilterChange={value => updates.push(`severity:${value}`)}
        onStatusFilterChange={value => updates.push(`status:${value}`)}
        onApplicationFilterChange={value =>
          updates.push(`application:${value}`)
        }
        onThreatClick={() => undefined}
        onDrawerClose={() => undefined}
      />,
    );

    assert.ok(
      textContent(container).includes(
        'No threats match your current search and filters',
      ),
    );
    assert.ok(textContent(container).includes('Clear filters'));

    const clearButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Clear filters'),
    );

    assert.ok(clearButton, 'Expected a clear filters action');

    await act(async () => {
      clearButton.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(updates, [
      'search:',
      'severity:all',
      'status:all',
      'application:all',
    ]);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const openedCompanyIds: string[] = [];

    const { container, root } = await renderComponent(
      <Dashboard
        companies={[
          {
            id: 'cmp_1',
            name: 'Northstar Digital',
            assessmentCount: 6,
            latestAssessment: {
              id: 'asm_1',
              name: 'Customer Services Portal',
              status: 'in-progress',
            },
          },
          {
            id: 'cmp_2',
            name: 'Meridian Finance',
            assessmentCount: 4,
            latestAssessment: {
              id: 'asm_2',
              name: 'Online Banking Portal',
              status: 'completed',
            },
          },
          {
            id: 'cmp_3',
            name: 'Summit Health',
            assessmentCount: 2,
          },
        ]}
        onOpenCompany={company => openedCompanyIds.push(company.id)}
      />,
      {
        'appsec-company-switcher-recents': JSON.stringify(['cmp_2', 'cmp_1']),
        'appsec-company-switcher-recent-open-times': JSON.stringify({
          cmp_2: '2026-06-14T16:45:00.000Z',
          cmp_1: '2026-06-15T08:15:00.000Z',
        }),
      },
    );

    const companyNames = Array.from(
      container.querySelectorAll('.dashboard-company-name'),
    ).map(node => node.textContent);

    assert.deepEqual(companyNames, [
      'Meridian Finance',
      'Northstar Digital',
      'Summit Health',
    ]);
    assert.ok(textContent(container).includes('Last opened'));
    assert.ok(textContent(container).includes('Active assessments'));
    assert.ok(textContent(container).includes('Latest assessment'));

    const companyRows = Array.from(
      container.querySelectorAll('.dashboard-recent-company-row'),
    ) as HTMLButtonElement[];

    assert.equal(companyRows.length, 3, 'Expected three recent company rows');
    assert.equal(
      companyRows[0]?.tagName,
      'BUTTON',
      'Expected the recent company item to be a button',
    );
    assert.equal(
      companyRows[0]?.getAttribute('type'),
      'button',
      'Expected the row button to use type="button"',
    );

    companyRows[0]?.focus();
    assert.equal(
      window.document.activeElement,
      companyRows[0],
      'Expected the row button to receive focus for keyboard interaction',
    );

    await act(async () => {
      companyRows[0]?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      await renderTick();
    });

    assert.deepEqual(openedCompanyIds, ['cmp_2']);

    await act(async () => {
      root.unmount();
    });
  }

  {
    const originalInnerWidth = window.innerWidth;
    try {
      Object.defineProperty(window, 'innerWidth', {
        value: 320,
        configurable: true,
      });

      const { container, root } = await renderComponent(
        <Dashboard
          companies={[
            {
              id: 'cmp_1',
              name: 'Northstar Digital',
              assessmentCount: 6,
              latestAssessment: {
                id: 'asm_1',
                name: 'Customer Services Portal',
                status: 'in-progress',
              },
            },
          ]}
          onOpenCompany={() => undefined}
        />,
      );

      assert.equal(
        container.querySelectorAll('.dashboard-recent-company-row').length,
        1,
        'Expected a single recent company row',
      );
      assert.ok(
        container.querySelector('.dashboard-company-details'),
        'Expected the metadata block to stay present at narrow widths',
      );
      assert.ok(
        textContent(container).includes('Customer Services Portal'),
        'Expected the latest assessment name to remain readable',
      );
      assert.ok(
        textContent(container).includes('Last opened —'),
        'Expected the missing last-opened metadata to remain readable',
      );
      assert.ok(
        textContent(container).includes('Active assessments'),
        'Expected the assessment count label to remain readable',
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
      });
    }
  }

  {
    const { container, root } = await renderComponent(
      <Dashboard companies={[]} onCreateCompany={() => undefined} />,
    );

    assert.ok(textContent(container).includes('Recent companies'));
    assert.ok(textContent(container).includes('No companies yet'));
    assert.ok(textContent(container).includes('Create company'));
    assert.ok(
      !textContent(container).includes('Active assessments'),
      'Expected the empty state to replace the recent company rows',
    );

    await act(async () => {
      root.unmount();
    });
  }

  console.log('page state checks passed');
})();
