import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import AssessmentDetailsView from './assessmentDetails.view';

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
          <AssessmentDetailsView
            activeSection="findings"
            overviewHref="/companies/cmp_1/assessments/asm_1/overview"
            findingsContent={
              <div data-testid="findings-content">Live findings</div>
            }
            onSectionChange={() => undefined}
            onBack={() => undefined}
            onAction={() => undefined}
            assessment={{
              id: 'asm_1',
              companyId: 'cmp_1',
              companyName: 'Northstar Digital',
              applicationName: 'Customer Services Portal',
              status: 'in-progress',
              recordVersion: 3,
              findingsCount: 12,
              evidenceCount: 4,
              reportVersionCount: 2,
            }}
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

  assert.ok(container.querySelector('.assessment-details-breadcrumb-list'));
  assert.ok(
    textContent(container).includes('Northstar Digital'),
    'Expected the company name breadcrumb',
  );
  assert.ok(
    container.querySelector(
      'a[href="/companies/cmp_1/assessments/asm_1/overview"]',
    ),
    'Expected the assessment name breadcrumb to link to the overview route',
  );
  assert.ok(
    textContent(container).includes('Findings'),
    'Expected the current section breadcrumb',
  );
  assert.equal(
    container
      .querySelector(
        '.assessment-details-breadcrumb-item span[aria-current="page"]',
      )
      ?.textContent?.trim(),
    'Findings',
  );
  assert.ok(
    container.querySelector('.assessment-details-mobile-back button'),
    'Expected the compact mobile back action',
  );
  assert.ok(
    container.querySelector('[data-testid="findings-content"]'),
    'Expected the findings content slot to render',
  );

  await act(async () => {
    root.unmount();
  });
})();

function textContent(container: HTMLElement) {
  return container.textContent ?? '';
}
