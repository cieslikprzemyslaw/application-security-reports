import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_OPTIONS,
  getOwaspTop10CategoryOption,
} from '~/domain';
import { defaultTheme } from '~/theme';

import ThreatForm from './threatForm.component';
import { buildOwaspCategoryOptions } from './threatForm.utils';

import type { ThreatFormValue } from './threatForm.type';

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
    window,
  };
};

const owaspCategoryValue = (code: string) =>
  getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

const initialValue: ThreatFormValue = {
  title: 'Missing Server-Side Authorization',
  owaspCategoryCode: owaspCategoryValue('A01'),
  customCategory: '',
  strideCategory: 'elevation-of-privilege',
  severity: 'critical',
  status: 'open',
  affectedComponent: 'Orders API',
  affectedEndpoint: '/api/v1/orders/{id}',
  observation:
    'The endpoint returns objects without verifying resource ownership.',
  reproductionSteps:
    'Request another user account while authenticated as a low-privilege user.',
  risk: 'An authenticated user can read another customer’s order details.',
  recommendation: 'Enforce object-level authorization on every request.',
  references: 'OWASP API1:2023, CWE-639',
  resolutionNote: '',
  acceptedRiskJustification: '',
};

await (async () => {
  {
    assert.deepEqual(
      buildOwaspCategoryOptions(OWASP_TOP_10_CURRENT_VERSION).map(
        option => option.value,
      ),
      [...OWASP_TOP_10_OPTIONS.map(option => option.value), 'custom'],
    );
    assert.deepEqual(
      buildOwaspCategoryOptions(OWASP_TOP_10_CURRENT_VERSION).map(
        option => option.label,
      ),
      [...OWASP_TOP_10_OPTIONS.map(option => option.label), 'Custom'],
    );
  }

  {
    const { container, window } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);
    const changeEvents: ThreatFormValue[] = [];

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <ThreatForm
            value={initialValue}
            owaspTaxonomyVersion={OWASP_TOP_10_CURRENT_VERSION}
            onChange={value => changeEvents.push(value)}
            onSubmit={event => event.preventDefault()}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const select = window.document.querySelector(
      '#threat-owasp-category-code',
    ) as HTMLSelectElement | null;

    assert.ok(select, 'Expected the OWASP category select');
    assert.equal(select?.value, owaspCategoryValue('A01'));
    assert.deepEqual(
      Array.from(select?.options ?? []).map(option => option.textContent),
      [...OWASP_TOP_10_OPTIONS.map(option => option.label), 'Custom'],
    );

    await act(async () => {
      select!.value = owaspCategoryValue('A05');
      select!.dispatchEvent(
        new window.Event('change', { bubbles: true, cancelable: true }),
      );
      await renderTick();
    });

    assert.equal(
      changeEvents.at(-1)?.owaspCategoryCode,
      owaspCategoryValue('A05'),
      'Expected the selected category code to be emitted',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container, window } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);
    const historicalValue = 'A01:2023';

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <ThreatForm
            value={{
              ...initialValue,
              owaspCategoryCode: historicalValue,
            }}
            owaspTaxonomyVersion={OWASP_TOP_10_CURRENT_VERSION}
            onChange={() => undefined}
            onSubmit={event => event.preventDefault()}
          />
        </ThemeProvider>,
      );
      await renderTick();
    });

    const select = window.document.querySelector(
      '#threat-owasp-category-code',
    ) as HTMLSelectElement | null;

    assert.ok(select, 'Expected the OWASP category select');
    assert.equal(select?.value, historicalValue);
    assert.ok(
      Array.from(select?.options ?? []).some(
        option => option.value === historicalValue,
      ),
      'Expected the historical category value to remain selectable',
    );

    await act(async () => {
      root.unmount();
    });
  }
})();
