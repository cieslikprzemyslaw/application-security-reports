import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import CompanySwitcher from './companySwitcher.component';
import { companySwitcherRecentsStorageKey } from './companySwitcher.utils';

const renderTick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
  Object.defineProperty(globalThis, key, {
    value,
    configurable: true,
    writable: true,
  });
};

const setupDom = () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/dashboard' },
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

  const container = window.document.getElementById('root');

  assert.ok(container, 'Expected root container to exist');

  return { container, window };
};

const companies = [
  {
    id: 'cmp_1',
    name: 'Northstar Digital',
    assessmentCount: 4,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'cmp_2',
    name: 'Meridian Finance',
    assessmentCount: 2,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'cmp_3',
    name: 'Summit Health',
    assessmentCount: 1,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'cmp_4',
    name: 'Blue River Labs',
    assessmentCount: 6,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'cmp_5',
    name: 'Atlas Retail',
    assessmentCount: 3,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'cmp_6',
    name: 'Helios Energy',
    assessmentCount: 5,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
];

const SwitcherHarness = ({
  activeCompany: initialActiveCompany,
  companyList = companies,
}: {
  activeCompany?: { id: string; name: string };
  companyList?: typeof companies;
}) => {
  const [activeCompany, setActiveCompany] = useState(initialActiveCompany);

  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <CompanySwitcher
        activeCompany={activeCompany}
        companies={companyList}
        onActiveCompanyChange={setActiveCompany}
      />
    </MemoryRouter>
  );
};

const renderComponent = async ({
  activeCompany,
  companyList = companies,
  recentCompanyIds = ['cmp_3', 'cmp_2', 'cmp_1'],
}: {
  activeCompany?: { id: string; name: string };
  companyList?: typeof companies;
  recentCompanyIds?: string[];
} = {}) => {
  const { container, window } = setupDom();
  const root = createRoot(container);

  window.localStorage.clear();
  window.localStorage.setItem(
    companySwitcherRecentsStorageKey,
    JSON.stringify(recentCompanyIds),
  );

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <SwitcherHarness
          activeCompany={activeCompany}
          companyList={companyList}
        />
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root, window };
};

const click = async (element: Element | null) => {
  assert.ok(element, 'Expected element to exist');

  await act(async () => {
    element.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
  });
};

await (async () => {
  {
    const companyList = companies.map(company =>
      company.id === 'cmp_2'
        ? {
            ...company,
            assessmentCount: undefined as unknown as number,
          }
        : company,
    );

    const { container, root, window } = await renderComponent({
      activeCompany: { id: 'cmp_2', name: 'Meridian Finance' },
      companyList,
    });

    const trigger = container.querySelector(
      '.sidebar-company-switcher',
    ) as HTMLButtonElement | null;

    assert.ok(trigger, 'Expected the switcher trigger');
    assert.equal(trigger?.tagName, 'BUTTON');
    assert.equal(trigger?.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(trigger?.getAttribute('aria-expanded'), 'false');

    await click(trigger);

    assert.equal(trigger?.getAttribute('aria-expanded'), 'true');
    assert.ok(
      window.document.body.textContent?.includes('Switch company'),
      'Expected the switcher dialog to open',
    );
    assert.ok(
      window.document.querySelector('input[placeholder="Search companies..."]'),
      'Expected the search field to be visible in the open drawer',
    );

    const closeButton = window.document.querySelector(
      'button[aria-label="Close company switcher"]',
    ) as HTMLButtonElement | null;

    assert.ok(closeButton, 'Expected the switcher close button');
    assert.equal(window.document.activeElement, closeButton);

    const visibleNames = Array.from(
      window.document.querySelectorAll('.company-switcher-item-name'),
    ).map(element => element.textContent);

    assert.deepEqual(visibleNames.slice(0, 5), [
      'Meridian Finance',
      'Summit Health',
      'Northstar Digital',
      'Blue River Labs',
      'Atlas Retail',
    ]);

    assert.ok(
      window.document.body.textContent?.includes('0 assessments'),
      'Expected missing counts to fall back to a safe value',
    );
    assert.ok(
      window.document.body.textContent?.includes('Current'),
      'Expected the current company badge to remain visible',
    );

    const viewAllButton = window.document.querySelector(
      '.company-switcher-actions-link',
    ) as HTMLButtonElement | null;

    assert.ok(viewAllButton, 'Expected the view all button');
    assert.equal(viewAllButton?.tagName, 'BUTTON');
    assert.equal(viewAllButton?.textContent?.trim(), 'View all');
    assert.ok(
      window.document.head.textContent?.includes(
        '.company-switcher-actions-link',
      ),
      'Expected the view all button styles to be injected',
    );

    const northstarButton = Array.from(
      window.document.querySelectorAll('.company-switcher-item-button'),
    ).find(button => button.textContent?.includes('Northstar Digital'));

    assert.ok(northstarButton, 'Expected the Northstar Digital option');

    await click(northstarButton);

    assert.equal(trigger?.getAttribute('aria-expanded'), 'false');
    assert.equal(
      container.querySelector('.sidebar-company-switcher-name')?.textContent,
      'Northstar Digital',
    );

    const storedRecentIds = JSON.parse(
      window.localStorage.getItem(companySwitcherRecentsStorageKey) ?? '[]',
    ) as string[];

    assert.deepEqual(storedRecentIds.slice(0, 3), ['cmp_1', 'cmp_3', 'cmp_2']);
    assert.equal(
      window.document.body.textContent?.includes('Switch company'),
      false,
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, root, window } = await renderComponent({
      companyList: [],
      recentCompanyIds: [],
    });

    assert.equal(
      container.querySelector('.sidebar-company-switcher-name')?.textContent,
      'Create company',
    );

    await click(container.querySelector('.sidebar-company-switcher'));

    assert.ok(
      window.document.body.textContent?.includes('No companies yet'),
      'Expected the empty state when no companies exist',
    );
    assert.ok(
      window.document.body.textContent?.includes('Create company'),
      'Expected the primary create company action',
    );

    await act(async () => {
      root.unmount();
    });
  }

  console.log('company switcher checks passed');
})();
