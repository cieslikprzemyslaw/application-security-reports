import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import {
  clickButton,
  findButtonByText,
  renderHarness,
  renderTick,
  seededEvidence,
  textContent,
} from '../testUtils/renderEvidenceTestApp';

const findDialogByText = (document: Document, text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).find(
    dialog => dialog.textContent?.includes(text),
  );

const findDeleteButtonForSeededEvidence = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    button =>
      button.getAttribute('aria-label') ===
      `Delete evidence ${seededEvidence.title}`,
  );

describe('EvidenceSection.delete', () => {
  it('requires confirmation, names the Evidence, cancels safely, and restores focus', async () => {
    const { container, root, window, restore } = await renderHarness([
      seededEvidence,
    ]);

    try {
      const deleteButton = findDeleteButtonForSeededEvidence(container);

      assert.ok(deleteButton, 'Expected delete action on the Evidence card');

      await act(async () => {
        clickButton(window, deleteButton!);
        await renderTick();
      });

      const dialog = findDialogByText(
        window.document,
        'Delete the current evidence record',
      );

      assert.ok(dialog, 'Expected delete confirmation dialog');
      assert.ok(
        textContent(dialog!).includes(seededEvidence.title),
        'Expected confirmation to name the Evidence',
      );

      const cancelButton = findButtonByText(dialog!, 'Cancel');
      assert.ok(cancelButton, 'Expected cancel action');

      await act(async () => {
        clickButton(window, cancelButton!);
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(
          findDialogByText(
            window.document,
            'Delete the current evidence record',
          ),
          undefined,
        );
      });

      await waitFor(() => {
        assert.equal(window.document.activeElement, deleteButton);
      });

      assert.ok(
        textContent(container).includes(seededEvidence.title),
        'Expected cancel to preserve the Evidence row',
      );
    } finally {
      await act(async () => {
        root.unmount();
      });
      restore();
    }
  }, 15_000);

  it('deletes Evidence from the list, refreshes the count, and focuses Add evidence when the last row is removed', async () => {
    let countDelta = 0;

    const { container, root, window, restore } = await renderHarness(
      [seededEvidence],
      {},
      {
        onMutationSuccess: delta => {
          countDelta += delta;
        },
      },
    );

    try {
      const deleteButton = findDeleteButtonForSeededEvidence(container);

      assert.ok(deleteButton, 'Expected delete action on the Evidence card');

      await act(async () => {
        clickButton(window, deleteButton!);
        await renderTick();
      });

      const dialog = findDialogByText(
        window.document,
        'Delete the current evidence record',
      );
      const confirmButton = findButtonByText(dialog!, 'Delete evidence');

      assert.ok(confirmButton, 'Expected confirm delete action');

      await act(async () => {
        clickButton(window, confirmButton!);
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Evidence deleted.'),
          'Expected a delete success message',
        );
      });

      await waitFor(() => {
        assert.equal(
          textContent(container).includes(seededEvidence.title),
          false,
          'Expected deleted Evidence to be removed from the list',
        );
      });

      assert.equal(countDelta, -1);

      await waitFor(() => {
        assert.equal(
          window.document.activeElement?.textContent?.includes('Add evidence'),
          true,
          'Expected focus to move to the nearest surviving action',
        );
      });
    } finally {
      await act(async () => {
        root.unmount();
      });
      restore();
    }
  }, 15_000);

  it('keeps Evidence and count unchanged after delete failure with a safe message', async () => {
    let countDelta = 0;
    let removeCalls = 0;

    const { container, root, window, restore } = await renderHarness(
      [seededEvidence],
      {
        remove: async () => {
          removeCalls += 1;
          throw new Error(
            'uploads/evidence/private-storage-key.sqlite raw backend detail',
          );
        },
      },
      {
        onMutationSuccess: delta => {
          countDelta += delta;
        },
      },
    );

    try {
      const deleteButton = findDeleteButtonForSeededEvidence(container);

      assert.ok(deleteButton, 'Expected delete action on the Evidence card');

      await act(async () => {
        clickButton(window, deleteButton!);
        await renderTick();
      });

      const dialog = findDialogByText(
        window.document,
        'Delete the current evidence record',
      );
      const confirmButton = findButtonByText(dialog!, 'Delete evidence');

      assert.ok(confirmButton, 'Expected confirm delete action');

      await act(async () => {
        clickButton(window, confirmButton!);
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(window.document.body).includes(
            'Unable to delete evidence. Please try again.',
          ),
          'Expected a safe delete failure message',
        );
      });

      assert.equal(removeCalls, 1);
      assert.equal(countDelta, 0);
      assert.ok(
        textContent(container).includes(seededEvidence.title),
        'Expected failed delete to preserve the Evidence row',
      );
      assert.equal(
        textContent(window.document.body).includes('uploads/evidence/'),
        false,
        'Expected raw storage paths to remain hidden',
      );
    } finally {
      await act(async () => {
        root.unmount();
      });
      restore();
    }
  }, 15_000);
});
