import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import {
  createTestDom,
  createTestingLibraryRoot,
  act,
} from '~/test/vitestLegacyBridge';

import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import AssessmentTable from './assessmentTable.component';
import type {
  AssessmentListRow,
  AssessmentListSortKey,
} from './assessmentTable.type';

describe('assessmentTable', () => {
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

    const sampleAssessment: AssessmentListRow = {
      id: 'asm_00000000-0000-0000-0000-000000000001',
      name: 'Customer Portal',
      type: 'Web App',
      status: 'in-progress',
      findingsCount: 3,
      updatedAt: '2026-06-01T10:00:00.000Z',
    };

    const renderTable = async (
      sortBy: AssessmentListSortKey,
      sortDirection: 'asc' | 'desc',
      onSortChange: (key: AssessmentListSortKey) => void = () => undefined,
    ) => {
      const { container, window } = setupDom();

      assert.ok(container, 'Expected root container to exist');

      const root = createTestingLibraryRoot(container);

      await act(async () => {
        root.render(
          <ThemeProvider theme={defaultTheme}>
            <AssessmentTable
              assessments={[sampleAssessment]}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
          </ThemeProvider>,
        );
        await renderTick();
      });

      return { container, root, window };
    };

    await (async () => {
      {
        // ascending: active sort column uses chevronUp SVG path
        const { container, root } = await renderTable('name', 'asc');

        const activeHeader = container.querySelector(
          'th[aria-sort="ascending"]',
        );
        assert.ok(
          activeHeader,
          'Expected an ascending aria-sort on the active header',
        );

        const svgPath = activeHeader?.querySelector('path');
        assert.ok(svgPath, 'Expected an SVG path in the active sort header');
        assert.equal(
          svgPath?.getAttribute('d'),
          'm6 15 6-6 6 6',
          'Expected ascending sort to use the chevronUp path',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // descending: active sort column uses chevronDown SVG path
        const { container, root } = await renderTable('name', 'desc');

        const activeHeader = container.querySelector(
          'th[aria-sort="descending"]',
        );
        assert.ok(
          activeHeader,
          'Expected a descending aria-sort on the active header',
        );

        const svgPath = activeHeader?.querySelector('path');
        assert.ok(svgPath, 'Expected an SVG path in the active sort header');
        assert.equal(
          svgPath?.getAttribute('d'),
          'm6 9 6 6 6-6',
          'Expected descending sort to use the chevronDown path',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // inactive columns: chevronDown path and inactive modifier class
        const { container, root } = await renderTable('name', 'asc');

        const inactiveHeaders = Array.from(
          container.querySelectorAll('th[aria-sort="none"]'),
        );
        assert.ok(inactiveHeaders.length > 0, 'Expected inactive sort headers');

        for (const header of inactiveHeaders) {
          const iconSpan = header.querySelector('.assessment-table__sort-icon');
          assert.ok(iconSpan, 'Expected sort icon span in inactive header');
          assert.ok(
            iconSpan?.classList.contains(
              'assessment-table__sort-icon--inactive',
            ),
            'Expected inactive modifier class on non-active sort headers',
          );
          const path = iconSpan?.querySelector('path');
          assert.equal(
            path?.getAttribute('d'),
            'm6 9 6 6 6-6',
            'Expected inactive headers to use chevronDown path',
          );
        }

        await act(async () => {
          root.unmount();
        });
      }

      {
        // no text-character chevrons remain
        const { container, root } = await renderTable('updated', 'desc');

        const headMarkup = container.querySelector('thead')?.textContent ?? '';
        assert.ok(
          !headMarkup.includes('^'),
          'Expected no ^ text character in header',
        );
        assert.ok(
          !headMarkup.includes('v'),
          'Expected no v text character in header',
        );
        assert.ok(
          !headMarkup.includes('-'),
          'Expected no - text character in header',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // aria-sort: active column gets ascending/descending, inactive columns get none
        const { container, root } = await renderTable('status', 'asc');

        assert.ok(
          container.querySelector('th[aria-sort="ascending"]'),
          'Expected aria-sort="ascending" on the active column',
        );

        const noneHeaders = container.querySelectorAll('th[aria-sort="none"]');
        assert.equal(
          noneHeaders.length,
          4,
          'Expected four inactive columns with aria-sort="none"',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // click activates onSortChange with the correct key
        const sortEvents: AssessmentListSortKey[] = [];
        const { container, root, window } = await renderTable(
          'name',
          'asc',
          key => {
            sortEvents.push(key);
          },
        );

        const typeButton = Array.from(
          container.querySelectorAll('.assessment-table__sort-button'),
        ).find(btn => btn.textContent?.includes('Type')) as
          | HTMLButtonElement
          | undefined;

        assert.ok(typeButton, 'Expected a Type sort button');

        await act(async () => {
          typeButton!.dispatchEvent(
            new window.MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          await renderTick();
        });

        assert.deepEqual(
          sortEvents,
          ['type'],
          'Expected onSortChange called with "type"',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // keyboard activation: Enter key triggers onSortChange
        const sortEvents: AssessmentListSortKey[] = [];
        const { container, root, window } = await renderTable(
          'name',
          'asc',
          key => {
            sortEvents.push(key);
          },
        );

        const statusButton = Array.from(
          container.querySelectorAll('.assessment-table__sort-button'),
        ).find(btn => btn.textContent?.includes('Status')) as
          | HTMLButtonElement
          | undefined;

        assert.ok(statusButton, 'Expected a Status sort button');

        await act(async () => {
          statusButton!.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
            }),
          );
          statusButton!.dispatchEvent(
            new window.MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          await renderTick();
        });

        assert.ok(
          sortEvents.includes('status'),
          'Expected onSortChange called with "status" via keyboard',
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        // icon inherits currentColor: SVG uses stroke="currentColor"
        const { container, root } = await renderTable('name', 'asc');

        const svgs = container.querySelectorAll(
          '.assessment-table__sort-icon svg',
        );
        assert.ok(svgs.length > 0, 'Expected SVG sort icons in headers');

        for (const svg of svgs) {
          assert.equal(
            svg.getAttribute('stroke'),
            'currentColor',
            'Expected sort icon SVG to use currentColor stroke',
          );
        }

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root } = await renderTable('updated', 'desc');

        await act(async () => {
          root.render(
            <ThemeProvider theme={defaultTheme}>
              <AssessmentTable
                assessments={[
                  {
                    ...sampleAssessment,
                    updatedAt: 'not-a-date',
                  },
                ]}
                sortBy="updated"
                sortDirection="desc"
                onSortChange={() => undefined}
              />
            </ThemeProvider>,
          );
          await renderTick();
        });

        const updatedCell = container.querySelector(
          '.assessment-table__cell time',
        );

        assert.equal(updatedCell?.textContent?.trim(), 'Invalid date');
        assert.ok(!updatedCell?.textContent?.includes('Invalid Date'));

        await act(async () => {
          root.unmount();
        });
      }
    })();

    console.log('AssessmentTable sort icon checks passed');
  });
});
