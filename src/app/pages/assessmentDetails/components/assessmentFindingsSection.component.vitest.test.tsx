import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act } from '~/test/vitestLegacyBridge';

import { OWASP_TOP_10_OPTIONS } from '~/domain';

import {
  owaspCategoryValue,
  renderHarness,
  renderTick,
  textContent,
} from './assessmentFindingsSection.testUtils';

describe('assessmentFindingsSection.component', () => {
  it('passes the migrated checks', async () => {
    await (async () => {
      {
        const { container, root, window, events } =
          await renderHarness('in-progress');

        assert.ok(
          textContent(container).includes('A01:2025 - Broken Access Control'),
          'Expected the threat table to render the registry-driven OWASP label',
        );

        const row = Array.from(
          container.querySelectorAll('.data-table-row--clickable'),
        ).find(item =>
          item.textContent?.includes('Broken object-level authorization'),
        ) as HTMLTableRowElement | undefined;

        assert.ok(row, 'Expected a clickable threats row');

        await act(async () => {
          row!.focus();
          row!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.deepEqual(events, ['view']);
        assert.ok(
          textContent(window.document.body).includes(
            'Broken object-level authorization',
          ),
        );
        assert.ok(textContent(window.document.body).includes('High'));
        assert.ok(
          textContent(window.document.body).includes(
            'A01:2025 - Broken Access Control',
          ),
        );
        assert.ok(textContent(window.document.body).includes('Orders API'));
        assert.ok(
          textContent(window.document.body).includes(
            'Unauthorized access to customer order data.',
          ),
        );
        assert.ok(
          textContent(window.document.body).includes('Enforce object-level'),
        );
        assert.ok(textContent(window.document.body).includes('Threat details'));

        const getCloseButton = () =>
          window.document.body.querySelector(
            'button[aria-label="Close threat details"]',
          ) as HTMLButtonElement | null;

        const closeButton = getCloseButton();

        assert.ok(closeButton, 'Expected the drawer close button');
        assert.equal(window.document.activeElement, closeButton);

        await act(async () => {
          closeButton!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.equal(window.document.activeElement, row);
        assert.ok(
          !textContent(window.document.body).includes('Threat details'),
          'Expected the read-only drawer to close',
        );

        await act(async () => {
          row!.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.deepEqual(events, ['view', 'view']);
        assert.ok(
          textContent(window.document.body).includes(
            'Broken object-level authorization',
          ),
        );

        const reopenedCloseButton = getCloseButton();

        assert.ok(
          reopenedCloseButton,
          'Expected the drawer close button to return',
        );

        await act(async () => {
          reopenedCloseButton!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        await act(async () => {
          row!.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: ' ',
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.deepEqual(events, ['view', 'view', 'view']);

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root, window, events } =
          await renderHarness('in-progress');

        const editButton = Array.from(
          container.querySelectorAll('button'),
        ).find(button => button.textContent?.trim() === 'Edit threat') as
          | HTMLButtonElement
          | undefined;

        assert.ok(editButton, 'Expected the row edit action');

        await act(async () => {
          editButton!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        assert.deepEqual(events, ['edit']);
        assert.ok(
          !textContent(window.document.body).includes('Threat details'),
          'Expected the edit action to open the editor instead of the details view',
        );
        assert.ok(
          window.document.body.querySelector('#threat-title'),
          'Expected the editable threat form to render',
        );
        assert.ok(
          textContent(window.document.body).includes('Save threat'),
          'Expected the drawer action to switch to the edit form',
        );

        const owaspSelect = window.document.body.querySelector(
          '#threat-owasp-category-code',
        ) as HTMLSelectElement | null;

        assert.ok(owaspSelect, 'Expected the OWASP category select');
        assert.equal(owaspSelect?.value, owaspCategoryValue('A01'));
        assert.deepEqual(
          Array.from(owaspSelect?.options ?? []).map(option => option.value),
          [...OWASP_TOP_10_OPTIONS.map(option => option.value), 'custom'],
        );
        assert.deepEqual(
          Array.from(owaspSelect?.options ?? []).map(
            option => option.textContent,
          ),
          [...OWASP_TOP_10_OPTIONS.map(option => option.label), 'Custom'],
        );

        await act(async () => {
          root.unmount();
        });
      }

      {
        const { container, root, window } = await renderHarness('in-progress');

        const addButton = Array.from(container.querySelectorAll('button')).find(
          button => button.textContent?.trim() === 'Add threat',
        ) as HTMLButtonElement | undefined;

        assert.ok(addButton, 'Expected the create action');

        await act(async () => {
          addButton!.dispatchEvent(
            new window.MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              button: 0,
            }),
          );
          await renderTick();
          await renderTick();
        });

        const createSelect = window.document.body.querySelector(
          '#threat-owasp-category-code',
        ) as HTMLSelectElement | null;

        assert.ok(createSelect, 'Expected the create form OWASP select');
        assert.equal(createSelect?.value, owaspCategoryValue('A01'));

        await act(async () => {
          root.unmount();
        });
      }
    })();
  }, 15_000);
});
