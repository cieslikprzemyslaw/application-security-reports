import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { ThemeProvider } from 'styled-components';

import Button from '~/app/components/ui/button';
import { defaultTheme } from '~/theme';

import Topbar from './topbar.component';
import TopbarUserIdentity from './topbarUserIdentity.component';

describe('topbar', () => {
  it('passes the migrated checks', async () => {
    const renderTick = () =>
      new Promise<void>(resolve => setTimeout(resolve, 0));

    const setGlobal = <K extends PropertyKey>(key: K, value: unknown) => {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    };

    const setupDom = () => {
      const dom = createTestDom(
        '<!doctype html><html><body><div id="root"></div></body></html>',
        { url: 'http://localhost' },
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

    const renderTopbar = async (isSidebarOpen = false) => {
      const { container, window } = setupDom();

      assert.ok(container, 'Expected root container to exist');

      const root = createTestingLibraryRoot(container);
      let menuClickCount = 0;
      let assessmentClickCount = 0;

      await act(async () => {
        root.render(
          <ThemeProvider theme={defaultTheme}>
            <Topbar
              title="AppSec Report Builder"
              onMenuClick={() => {
                menuClickCount += 1;
              }}
              menuButtonControls="application-sidebar"
              menuButtonExpanded={isSidebarOpen}
              search={<input aria-label="Search" placeholder="Search" />}
              actions={
                <Button
                  title="New assessment"
                  variant="secondary"
                  onClick={() => {
                    assessmentClickCount += 1;
                  }}
                />
              }
              userMenu={
                <TopbarUserIdentity
                  fullName="Alex Mercer"
                  role="Lead Pentester"
                />
              }
            />
          </ThemeProvider>,
        );
        await renderTick();
      });

      return {
        container,
        root,
        window,
        getMenuClickCount: () => menuClickCount,
        getAssessmentClickCount: () => assessmentClickCount,
      };
    };

    await (async () => {
      {
        const {
          container,
          root,
          window,
          getMenuClickCount,
          getAssessmentClickCount,
        } = await renderTopbar();
        const menuButton = container.querySelector(
          'button[aria-label="Open navigation menu"]',
        ) as HTMLButtonElement | null;

        assert.ok(menuButton, 'Expected menu button to render');
        assert.equal(
          menuButton?.getAttribute('aria-controls'),
          'application-sidebar',
        );
        assert.equal(menuButton?.getAttribute('aria-expanded'), 'false');
        assert.equal(menuButton?.tagName, 'BUTTON');

        const topbarUserMenu = container.querySelector(
          '.topbar-user-menu',
        ) as HTMLElement | null;
        const userIdentityRoot =
          topbarUserMenu?.firstElementChild as HTMLElement | null;

        assert.ok(topbarUserMenu, 'Expected user identity slot to render');
        assert.ok(userIdentityRoot, 'Expected user identity root to render');
        assert.ok(
          topbarUserMenu.contains(userIdentityRoot),
          'Expected user identity to render on the right side of the topbar',
        );
        assert.equal(
          userIdentityRoot?.getAttribute('aria-label'),
          'Local user: Alex Mercer, Lead Pentester',
        );
        assert.match(
          userIdentityRoot?.textContent ?? '',
          /Alex Mercer.*Lead Pentester/u,
        );

        menuButton?.focus();
        assert.equal(window.document.activeElement, menuButton);

        assert.equal(userIdentityRoot?.tagName, 'DIV');
        assert.equal(userIdentityRoot?.getAttribute('role'), null);
        assert.equal(userIdentityRoot?.getAttribute('tabindex'), null);

        userIdentityRoot?.focus();
        assert.notEqual(window.document.activeElement, userIdentityRoot);
        assert.equal(window.document.activeElement, menuButton);

        const newAssessmentButton = container.querySelector(
          '.topbar-actions button',
        ) as HTMLButtonElement | null;

        assert.ok(newAssessmentButton, 'Expected shared button to render');
        assert.ok(
          newAssessmentButton?.classList.contains('button'),
          'Expected the shared application button styling to be applied',
        );
        assert.equal(newAssessmentButton?.textContent, 'New assessment');

        await act(async () => {
          menuButton?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(getMenuClickCount(), 1);

        await act(async () => {
          newAssessmentButton?.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
        });

        assert.equal(getAssessmentClickCount(), 1);
        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderTopbar(true);
        const menuButton = container.querySelector(
          'button[aria-label="Open navigation menu"]',
        ) as HTMLButtonElement | null;

        assert.equal(menuButton?.getAttribute('aria-expanded'), 'true');

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderTopbar();
        const userIdentityButton = container.querySelector(
          '.topbar-user-menu button',
        ) as HTMLButtonElement | null;

        assert.equal(userIdentityButton, null);

        await act(async () => {
          root.unmount();
        });
      }
    })();
  });
});
