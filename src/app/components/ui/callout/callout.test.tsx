import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';

import Button from '../button';
import { defaultTheme } from '~/theme';

import Callout from './callout.component';

const renderTick = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

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
    {
      url: 'http://localhost/',
    },
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

await (async () => {
  {
    const { container, window } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);
    let dismissCount = 0;

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <Callout
            variant="error"
            title="Unable to load companies"
            actions={
              <Button
                title="Retry"
                variant="secondary"
                onClick={() => undefined}
              />
            }
            dismissLabel="Dismiss load error"
            onDismiss={() => {
              dismissCount += 1;
            }}
          >
            <p>The companies list could not be loaded.</p>
          </Callout>
        </ThemeProvider>,
      );

      await renderTick();
    });

    const alert = container.querySelector('[role="alert"]');

    assert.ok(alert, 'Expected an alert role for error callouts');
    assert.equal(alert?.getAttribute('aria-live'), 'assertive');
    assert.equal(alert?.getAttribute('aria-atomic'), 'true');
    assert.ok(
      container.textContent?.includes(
        'The companies list could not be loaded.',
      ),
      'Expected the alert copy to stay visible',
    );

    const retryButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Retry'),
    ) as HTMLButtonElement | undefined;

    assert.ok(retryButton, 'Expected the retry action');

    const dismissButton = container.querySelector(
      'button[aria-label="Dismiss load error"]',
    ) as HTMLButtonElement | null;

    assert.ok(dismissButton, 'Expected the dismiss action');
    assert.equal(dismissButton?.type, 'button');

    await act(async () => {
      dismissButton?.dispatchEvent(
        new window.MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );

      await renderTick();
    });

    assert.equal(dismissCount, 1);
    assert.ok(
      container.textContent?.includes(
        'The companies list could not be loaded.',
      ),
      'Expected the alert to remain visible until the parent dismisses it',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const sheet = new ServerStyleSheet();

    try {
      const markup = renderToString(
        sheet.collectStyles(
          <ThemeProvider theme={defaultTheme}>
            <Callout
              variant="warning"
              title="Long content warning"
              actions={<Button title="Retry" variant="secondary" />}
            >
              <p>
                This message is intentionally long so the stylesheet keeps the
                body and action layout readable on narrow screens and allows the
                text to wrap instead of overflowing the container.
              </p>
              <p>
                Additional text should continue to wrap cleanly across mobile
                widths.
              </p>
            </Callout>
          </ThemeProvider>,
        ),
      );

      assert.ok(markup.includes('role="status"'));
      assert.ok(markup.includes('aria-live="polite"'));

      const styles = sheet.getStyleTags();

      assert.ok(
        styles.includes('@media (max-width: 40rem)'),
        'Expected a mobile layout breakpoint',
      );
      assert.match(
        styles,
        /grid-column:\s*1\s*\/\s*-1/,
        'Expected the action row to span the full width on mobile',
      );
      assert.match(
        styles,
        /overflow-wrap:\s*anywhere/,
        'Expected long body text to wrap safely',
      );
    } finally {
      sheet.seal();
    }
  }
})();
