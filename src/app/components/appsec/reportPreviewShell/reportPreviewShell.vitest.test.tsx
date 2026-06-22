import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { ThemeProvider, useTheme } from 'styled-components';

import { darkTheme } from '~/theme';

import ReportPreviewShell from './reportPreviewShell.component';

describe('reportPreviewShell', () => {
  it('passes the migrated checks', async () => {
    const renderTick = () =>
      new Promise(resolve => {
        setTimeout(resolve, 0);
      });

    const setGlobal = (
      key: keyof typeof globalThis | string,
      value: unknown,
    ) => {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    };

    const setupDom = () => {
      const dom = createTestDom(
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
      setGlobal('MouseEvent', window.MouseEvent);

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
        <span
          data-testid={`${label.toLowerCase()}-theme`}
          data-surface={theme.colors.surface.card}
        >
          {label}{' '}
        </span>
      );
    };

    const clickButton = async (container: HTMLElement, label: string) => {
      const button = Array.from(container.querySelectorAll('button')).find(
        element => element.textContent === label,
      ) as HTMLButtonElement | undefined;

      assert.ok(button, `Expected a "${label}" button`);

      await act(async () => {
        button.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );

        await renderTick();
      });
    };

    await (async () => {
      const { container } = setupDom();

      assert.ok(container, 'Expected root container to exist');

      const root = createTestingLibraryRoot(container);

      await act(async () => {
        root.render(
          <ThemeProvider theme={darkTheme}>
            <ReportPreviewShell
              applicationName="AppSec Report Builder"
              assessmentCode="ASM-001"
              preview={<ThemeProbe label="Preview" />}
              dataView={<ThemeProbe label="Data" />}
            />
          </ThemeProvider>,
        );

        await renderTick();
      });

      assert.equal(
        container
          .querySelector('[data-testid="preview-theme"]')
          ?.getAttribute('data-surface'),
        '#FFFFFF',
      );

      assert.ok(container.textContent?.includes('Report Preview'));

      await clickButton(container, 'Data');

      assert.equal(
        container
          .querySelector('[data-testid="data-theme"]')
          ?.getAttribute('data-surface'),
        '#FFFFFF',
      );

      await act(async () => {
        root.unmount();
      });
    })();
  });
});
