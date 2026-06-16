import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import CompanyOverviewDashboardView from './companyOverviewDashboard.view';

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

  return {
    container: window.document.getElementById('root'),
  };
};

const renderView = async () => {
  const { container } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={defaultTheme}>
        <MemoryRouter>
          <CompanyOverviewDashboardView
            companyId="cmp_1"
            overview={{
              company: {
                id: 'cmp_1',
                name: 'Northstar Digital',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
              },
              assessmentCounts: {
                total: 3,
                draft: 1,
                inProgress: 1,
                completed: 1,
              },
              recentAssessments: [],
              recentReports: [],
            }}
            onEditCompany={() => undefined}
          />
        </MemoryRouter>
      </ThemeProvider>,
    );
    await renderTick();
  });

  return { container, root };
};

await (async () => {
  const { container, root } = await renderView();

  assert.ok(
    textContent(container).includes('Northstar Digital'),
    'Expected the company breadcrumb',
  );
  assert.ok(
    textContent(container).includes('Overview'),
    'Expected the current section breadcrumb',
  );
  assert.equal(
    container
      .querySelector('.page-header-breadcrumb-item span[aria-current="page"]')
      ?.textContent?.trim(),
    'Overview',
  );

  await act(async () => {
    root.unmount();
  });
})();

function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}
