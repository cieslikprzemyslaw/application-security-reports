import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import {
  clickButton,
  findButtonByText,
  renderHarness,
  renderTick,
  seededEvidence,
  setFileSelection,
  textContent,
} from '../testUtils/renderEvidenceTestApp';

describe('EvidenceSection.edge', () => {
  it('passes the migrated checks', async () => {
    await (async () => {
      const { container, root, window, restore } = await renderHarness(
        [],
        {
          getById: async () => {
            throw new Error('Evidence not found.');
          },
        },
        { openEvidenceId: seededEvidence.id },
      );

      await waitFor(() => {
        assert.ok(
          textContent(window.document.body).includes('Evidence not found'),
        );
        assert.ok(textContent(window.document.body).includes('Retry'));
      });

      const addButton = findButtonByText(container, 'Add evidence');
      assert.equal(addButton?.textContent?.includes('Add evidence'), true);

      const invalidAttachmentAdd = addButton;
      assert.ok(invalidAttachmentAdd);

      await act(async () => {
        clickButton(window, invalidAttachmentAdd!);
        await renderTick();
        await renderTick();
      });

      const attachmentInput = window.document.body.querySelector(
        '#evidence-attachment',
      ) as HTMLInputElement | null;

      assert.ok(
        attachmentInput,
        'Expected attachment input in the create drawer',
      );

      await act(async () => {
        setFileSelection(window, attachmentInput!, [
          {
            name: 'unsafe.html',
            type: 'text/html',
            size: 10,
          } as unknown as File,
        ]);
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes(
          'evidence attachment allowlist',
        ),
        'Expected file-type validation feedback',
      );

      const bigFile = {
        name: 'big.png',
        type: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      } as unknown as File;

      await act(async () => {
        setFileSelection(window, attachmentInput!, [bigFile]);
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes('5 MB or smaller'),
        'Expected file-size validation feedback',
      );

      await act(async () => {
        root.unmount();
      });

      restore();
    })();
  }, 15_000);
});
