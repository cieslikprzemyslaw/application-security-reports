import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';

import Button from '../button';
import { defaultTheme } from '~/theme';

import EmptyState from './emptyState.component';

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

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <EmptyState
            title="No threats yet"
            description="Add the first threat to start tracking the assessment."
            primaryAction={<Button title="Add threat" />}
            secondaryAction={
              <Button title="Import threats" variant="secondary" />
            }
          />
        </ThemeProvider>,
      );

      await renderTick();
    });

    const legacyState = container.querySelector(
      '[data-variant="legacy"]',
    ) as HTMLElement | null;

    assert.ok(legacyState, 'Expected the legacy empty state to render');
    assert.equal(legacyState?.getAttribute('role'), 'status');
    assert.equal(legacyState?.getAttribute('aria-live'), 'polite');
    assert.equal(legacyState?.getAttribute('aria-atomic'), 'true');
    assert.ok(
      container.textContent?.includes('No threats yet'),
      'Expected the empty-state title to stay visible',
    );

    const addButton = Array.from(container.querySelectorAll('button')).find(
      button => button.textContent?.includes('Add threat'),
    ) as HTMLButtonElement | undefined;

    assert.ok(addButton, 'Expected the primary action to be accessible');
    assert.equal(addButton?.type, 'button');

    const title = legacyState?.querySelector('.empty-state-title');
    const description = legacyState?.querySelector('.empty-state-description');

    assert.ok(title, 'Expected the legacy state to expose a labelled title');
    assert.ok(
      description,
      'Expected the legacy state to expose a description element',
    );

    const labelledBy = legacyState?.getAttribute('aria-labelledby')?.split(' ');

    assert.equal(labelledBy?.length, 1);
    assert.equal(
      labelledBy?.[0] &&
        window.document.getElementById(labelledBy[0])?.textContent,
      'No threats yet',
    );
    assert.equal(
      legacyState?.getAttribute('aria-describedby'),
      description?.id,
    );
    assert.equal(
      legacyState?.querySelector('.empty-state-eyebrow'),
      null,
      'Expected the legacy state not to render a variant eyebrow',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <EmptyState
            variant="first-use"
            title="No threats yet"
            description={
              <>
                <p>Add the first threat to start tracking the assessment.</p>
                <p>The layout should still read cleanly on narrow screens.</p>
              </>
            }
            primaryAction={<Button title="Add threat" />}
          />
        </ThemeProvider>,
      );

      await renderTick();
    });

    const firstUseState = container.querySelector(
      '[data-variant="first-use"]',
    ) as HTMLElement | null;

    assert.ok(firstUseState, 'Expected the first-use variant to render');
    assert.equal(firstUseState?.getAttribute('role'), 'region');
    assert.equal(firstUseState?.hasAttribute('aria-live'), false);
    assert.equal(firstUseState?.getAttribute('data-variant'), 'first-use');
    assert.ok(
      firstUseState?.textContent?.includes('First use'),
      'Expected the first-use eyebrow to provide context',
    );

    const title = firstUseState?.querySelector('.empty-state-title');
    const description = firstUseState?.querySelector(
      '.empty-state-description',
    );
    const eyebrow = firstUseState?.querySelector('.empty-state-eyebrow');

    assert.ok(title, 'Expected the first-use title to render');
    assert.ok(description, 'Expected the first-use description to render');
    assert.ok(eyebrow, 'Expected the first-use eyebrow to render');

    const labelledBy = firstUseState
      ?.getAttribute('aria-labelledby')
      ?.split(' ');

    assert.equal(labelledBy?.length, 2);
    assert.equal(
      labelledBy?.[0] &&
        window.document.getElementById(labelledBy[0])?.textContent,
      'First use',
    );
    assert.equal(
      labelledBy?.[1] &&
        window.document.getElementById(labelledBy[1])?.textContent,
      'No threats yet',
    );
    assert.equal(
      firstUseState?.getAttribute('aria-describedby'),
      description?.id,
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <EmptyState
            variant="no-results"
            title='No threats match "oauth"'
            description="Clear the search and filters to show all threats again."
            primaryAction={<Button title="Clear filters" variant="secondary" />}
          />
        </ThemeProvider>,
      );

      await renderTick();
    });

    const noResultsState = container.querySelector(
      '[data-variant="no-results"]',
    ) as HTMLElement | null;

    assert.ok(noResultsState, 'Expected the no-results variant to render');
    assert.equal(noResultsState?.getAttribute('role'), 'status');
    assert.equal(noResultsState?.getAttribute('aria-live'), 'polite');
    assert.equal(noResultsState?.getAttribute('aria-atomic'), 'true');
    assert.ok(
      noResultsState?.textContent?.includes('No results'),
      'Expected the no-results eyebrow to be announced',
    );

    await act(async () => {
      root.unmount();
    });
  }

  {
    const { container } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={defaultTheme}>
          <EmptyState
            variant="unavailable"
            title="Threats unavailable"
            description="This section is temporarily unavailable while the workspace reloads."
            primaryAction={<Button title="Retry" variant="secondary" />}
          />
        </ThemeProvider>,
      );

      await renderTick();
    });

    const unavailableState = container.querySelector(
      '[data-variant="unavailable"]',
    ) as HTMLElement | null;

    assert.ok(unavailableState, 'Expected the unavailable variant to render');
    assert.equal(unavailableState?.getAttribute('role'), 'note');
    assert.equal(unavailableState?.hasAttribute('aria-live'), false);
    assert.ok(
      unavailableState?.textContent?.includes('Unavailable'),
      'Expected the unavailable eyebrow to provide context',
    );

    await act(async () => {
      root.unmount();
    });
  }
})();
