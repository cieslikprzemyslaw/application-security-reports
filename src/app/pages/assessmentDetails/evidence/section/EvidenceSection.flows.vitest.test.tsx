import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, waitFor } from '~/test/vitestLegacyBridge';

import { evidenceService } from '~/services';

import {
  clickButton,
  findButtonByText,
  renderHarness,
  renderTick,
  setFileSelection,
  setInputValue,
  setSelectValue,
  textContent,
  toggleCheckbox,
} from '../testUtils/renderEvidenceTestApp';

describe('EvidenceSection.flows', () => {
  it('passes the migrated checks', async () => {
    await (async () => {
      const { container, root, window, restore } = await renderHarness([]);

      const addButton = findButtonByText(container, 'Add evidence');

      assert.ok(addButton, 'Expected the create button');

      await act(async () => {
        clickButton(window, addButton!);
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(
          window.document.activeElement?.getAttribute('aria-label'),
          'Close evidence details',
          'Expected focus to move inside the evidence drawer',
        );
      });
      assert.ok(
        textContent(window.document.body).includes(
          'Remove access tokens, session cookies, passwords and secrets, API keys, authentication headers, and sensitive personal data',
        ),
        'Expected the redaction warning to be visible',
      );
      assert.ok(
        !textContent(window.document.body).includes('uploads/evidence/'),
        'Expected internal storage paths to stay hidden from the UI',
      );

      const typeSelect = window.document.body.querySelector(
        '#evidence-type',
      ) as HTMLSelectElement | null;
      const titleInput = window.document.body.querySelector(
        '#evidence-title',
      ) as HTMLInputElement | null;
      const descriptionInput = window.document.body.querySelector(
        '#evidence-description',
      ) as HTMLTextAreaElement | null;
      const contentInput = window.document.body.querySelector(
        '#evidence-content',
      ) as HTMLTextAreaElement | null;
      const capturedDateInput = window.document.body.querySelector(
        '#evidence-captured-at',
      ) as HTMLInputElement | null;
      const threatOne = window.document.body.querySelector(
        '#evidence-threat-thr_00000000-0000-0000-0000-000000000001',
      ) as HTMLInputElement | null;
      const threatTwo = window.document.body.querySelector(
        '#evidence-threat-thr_00000000-0000-0000-0000-000000000002',
      ) as HTMLInputElement | null;

      assert.ok(
        typeSelect &&
          titleInput &&
          descriptionInput &&
          contentInput &&
          capturedDateInput,
      );

      await act(async () => {
        setSelectValue(window, typeSelect!, 'http');
        setInputValue(window, titleInput!, 'Created HTTP evidence');
        setInputValue(window, descriptionInput!, 'Captured trace');
        setInputValue(window, contentInput!, '<script>alert("x")</script>');
        setInputValue(window, capturedDateInput!, '2026-06-12');
        toggleCheckbox(window, threatOne!, true);
        toggleCheckbox(window, threatTwo!, true);
        await renderTick();
      });

      const requestMethodInputs = window.document.body.querySelectorAll(
        'input[id$="requestMethod"]',
      ) as NodeListOf<HTMLInputElement>;
      const requestUrlInputs = window.document.body.querySelectorAll(
        'input[id$="requestUrl"]',
      ) as NodeListOf<HTMLInputElement>;
      const requestBodyInputs = window.document.body.querySelectorAll(
        'textarea[id$="requestBody"]',
      ) as NodeListOf<HTMLTextAreaElement>;
      const responseStatusInputs = window.document.body.querySelectorAll(
        'input[id$="responseStatusCode"]',
      ) as NodeListOf<HTMLInputElement>;
      const responseBodyInputs = window.document.body.querySelectorAll(
        'textarea[id$="responseBody"]',
      ) as NodeListOf<HTMLTextAreaElement>;

      assert.equal(requestMethodInputs.length, 1);

      await act(async () => {
        setInputValue(window, requestMethodInputs[0]!, 'GET');
        setInputValue(window, requestUrlInputs[0]!, '/api/orders/1');
        setInputValue(window, requestBodyInputs[0]!, 'request body');
        setInputValue(window, responseStatusInputs[0]!, '200');
        setInputValue(window, responseBodyInputs[0]!, 'response body');
        await renderTick();
      });

      const addExchangeButton = findButtonByText(
        window.document.body,
        'Add exchange',
      );

      assert.ok(addExchangeButton, 'Expected the add exchange button');

      await act(async () => {
        clickButton(window, addExchangeButton!);
        await renderTick();
      });

      const requestMethodInputsAfterAdd = window.document.body.querySelectorAll(
        'input[id$="requestMethod"]',
      ) as NodeListOf<HTMLInputElement>;
      const secondExchangeMethod = requestMethodInputsAfterAdd[1];
      const secondExchangeUrl = window.document.body.querySelectorAll(
        'input[id$="requestUrl"]',
      )[1] as HTMLInputElement;
      const secondExchangeStatus = window.document.body.querySelectorAll(
        'input[id$="responseStatusCode"]',
      )[1] as HTMLInputElement;

      assert.ok(
        secondExchangeMethod && secondExchangeUrl && secondExchangeStatus,
      );

      await act(async () => {
        setInputValue(window, secondExchangeMethod!, 'POST');
        setInputValue(window, secondExchangeUrl!, '/api/orders/2');
        setInputValue(window, secondExchangeStatus!, '201');
        await renderTick();
      });

      const moveDownButton = Array.from(
        window.document.body.querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Move down')) as
        | HTMLButtonElement
        | undefined;

      assert.ok(moveDownButton, 'Expected a move down control');

      await act(async () => {
        clickButton(window, moveDownButton!);
        await renderTick();
      });

      const attachmentInput = window.document.body.querySelector(
        '#evidence-attachment',
      ) as HTMLInputElement | null;

      assert.ok(attachmentInput, 'Expected the attachment input');

      await act(async () => {
        setFileSelection(window, attachmentInput!, [
          {
            name: 'capture.json',
            type: 'application/json',
            size: 1234,
          } as unknown as File,
        ]);
        await renderTick();
      });

      assert.ok(textContent(window.document.body).includes('capture.json'));

      const submitButton = findButtonByText(
        window.document.body,
        'Create evidence',
      );
      assert.ok(submitButton, 'Expected the create submit button');

      await act(async () => {
        clickButton(window, submitButton!);
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes('Evidence saved.'),
        'Expected a success indication after create',
      );
      assert.ok(
        textContent(window.document.body).includes('Created HTTP evidence'),
      );

      const createdOpenButton = Array.from(
        window.document.body.querySelectorAll<HTMLButtonElement>(
          '.assessment-evidence-card-title-button',
        ),
      ).find(button => button.textContent?.includes('Created HTTP evidence'));
      assert.ok(createdOpenButton, 'Expected the created evidence open action');

      await act(async () => {
        clickButton(window, createdOpenButton!);
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(window.document.body).includes(
            '<script>alert("x")</script>',
          ),
        );
      });
      assert.equal(window.document.body.querySelector('script'), null);

      const createdEditButton = findButtonByText(
        window.document.body,
        'Edit evidence',
      );
      assert.ok(createdEditButton, 'Expected the edit action in the drawer');

      await act(async () => {
        clickButton(window, createdEditButton!);
        await renderTick();
        await renderTick();
      });

      const restoredThreatOne = window.document.body.querySelector(
        '#evidence-threat-thr_00000000-0000-0000-0000-000000000001',
      ) as HTMLInputElement | null;
      const restoredThreatTwo = window.document.body.querySelector(
        '#evidence-threat-thr_00000000-0000-0000-0000-000000000002',
      ) as HTMLInputElement | null;
      const editTypeSelect = window.document.body.querySelector(
        '#evidence-type',
      ) as HTMLSelectElement | null;

      assert.ok(restoredThreatOne?.checked);
      assert.ok(restoredThreatTwo?.checked);

      await act(async () => {
        toggleCheckbox(window, restoredThreatOne!, false);
        toggleCheckbox(window, restoredThreatTwo!, false);
        setSelectValue(window, editTypeSelect!, 'text');
        await renderTick();
      });

      const exchangeSection = window.document.body.querySelector(
        'section[aria-labelledby="evidence-http-exchanges-heading"]',
      );
      assert.equal(
        exchangeSection,
        null,
        'Expected HTTP controls to disappear for text evidence',
      );

      const saveButton = findButtonByText(
        window.document.body,
        'Save evidence',
      );
      assert.ok(saveButton, 'Expected the save submit button');

      await act(async () => {
        clickButton(window, saveButton!);
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes('Evidence saved.'),
        'Expected a success indication after update',
      );

      const openButton = window.document.body.querySelector(
        '.assessment-evidence-card-title-button',
      ) as HTMLButtonElement | null;
      assert.ok(openButton, 'Expected the evidence card open button');

      await act(async () => {
        clickButton(window, openButton!);
        await renderTick();
        await renderTick();
      });

      assert.ok(textContent(window.document.body).includes('Delete evidence'));

      const originalGetById = evidenceService.getById;
      evidenceService.getById = async () => {
        throw new Error('Attachment unavailable.');
      };

      const downloadButton = findButtonByText(
        window.document.body,
        'Download unavailable',
      );
      assert.ok(downloadButton, 'Expected the attachment download action');

      await act(async () => {
        clickButton(window, downloadButton!);
        await renderTick();
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes(
          'Unable to download attachment',
        ),
        'Expected a safe attachment download error',
      );

      evidenceService.getById = originalGetById;

      const deleteButton = findButtonByText(
        window.document.body,
        'Delete evidence',
      );
      assert.ok(deleteButton, 'Expected the delete action in the drawer');

      await act(async () => {
        clickButton(window, deleteButton!);
        await renderTick();
      });

      assert.ok(
        textContent(window.document.body).includes(
          'Delete the current evidence record',
        ),
      );

      const deleteConfirmationDialog = Array.from(
        window.document.querySelectorAll<HTMLElement>('[role="dialog"]'),
      ).find(dialog =>
        dialog.textContent?.includes('Delete the current evidence record'),
      );
      const confirmDeleteButton = findButtonByText(
        deleteConfirmationDialog!,
        'Delete evidence',
      );
      assert.ok(confirmDeleteButton, 'Expected the delete confirmation button');

      await act(async () => {
        clickButton(window, confirmDeleteButton!);
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(window.document.body).includes('Evidence deleted.'),
          'Expected a success indication after delete',
        );
      });

      await act(async () => {
        root.unmount();
      });

      restore();
    })();
  }, 15_000);
});
