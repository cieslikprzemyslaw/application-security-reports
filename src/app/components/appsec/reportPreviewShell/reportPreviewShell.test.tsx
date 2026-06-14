import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from 'styled-components';

import { darkTheme } from '~/theme';

import ReportPreviewShell from './reportPreviewShell.component';

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

const ThemeProbe = ({ label }: { label: string }) => {
  const theme = useTheme();

  return (
    <output data-testid={label} data-surface={theme.colors.surface.page}>
      {theme.colors.surface.card}
    </output>
  );
};

const clickButton = async (
  container: HTMLElement,
  domWindow: Window,
  label: string,
) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    element => element.textContent === label,
  ) as HTMLButtonElement | undefined;

  assert.ok(button, `Expected a "${label}" button`);

  await act(async () => {
    button?.dispatchEvent(
      new domWindow.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
  });
};

await (async () => {
  const { container, window } = setupDom();

  assert.ok(container, 'Expected root container to exist');

  const root = createRoot(container);

  await act(async () => {
    root.render(
      <ThemeProvider theme={darkTheme}>
        <ReportPreviewShell
          applicationName="Customer Services Portal"
          assessmentCode="NSD-CSP-2026-014"
          autoSaved={false}
          preview={<ThemeProbe label="preview-theme" />}
          dataView={<ThemeProbe label="data-theme" />}
        />
      </ThemeProvider>,
    );
    await renderTick();
  });

  assert.equal(
    container
      .querySelector('[data-testid="preview-theme"]')
      ?.getAttribute('data-surface'),
    '#F4F6FA',
  );
  assert.ok(container.textContent?.includes('Report Preview'));

  await clickButton(container, window, 'Data');

  assert.equal(
    container
      .querySelector('[data-testid="data-theme"]')
      ?.getAttribute('data-surface'),
    '#F4F6FA',
  );

  await act(async () => {
    root.unmount();
  });
})();
