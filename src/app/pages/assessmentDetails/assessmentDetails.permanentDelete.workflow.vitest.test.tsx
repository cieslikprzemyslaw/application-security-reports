import { describe, it } from 'vitest';

import assert from 'node:assert/strict';

import { act, fireEvent, waitFor } from '~/test/vitestLegacyBridge';

import { routes } from '~/routes';
import {
  companyResponse,
  createAssessmentOverviewResponse,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  setFetch,
  textContent,
} from './assessmentDetails.router.testUtils';

const createArchivedAssessmentOverview = () => {
  const response = createAssessmentOverviewResponse('asm_archived', 2);

  response.data.assessment = {
    ...response.data.assessment,
    status: 'archived',
    findingsCount: 4,
    evidenceCount: 2,
    reportVersionCount: 1,
    availableActions: ['reopen'],
  };

  return response;
};

const findButtonByName = (name: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    button => button.textContent?.trim() === name,
  );

const openPermanentDeleteDialog = async () => {
  const deleteButton = await waitFor(() => {
    const button = findButtonByName('Permanent delete');

    assert.ok(button, 'Expected archived Assessment delete action');

    return button;
  });

  await act(async () => {
    deleteButton.click();
    await renderTick();
  });

  const dialog = await waitFor(() => {
    const currentDialog =
      document.querySelector<HTMLElement>('[role="dialog"]');

    assert.ok(currentDialog, 'Expected permanent delete dialog');

    return currentDialog;
  });

  return { deleteButton, dialog };
};

describe('assessmentDetails.permanentDelete', () => {
  it('requires exact-name confirmation, shows dependency counts, deletes, and navigates once', async () => {
    const requests: string[] = [];

    setFetch(async (input, init) => {
      const path = String(input);
      requests.push(`${init?.method ?? 'GET'} ${path}`);

      if (path === '/api/companies') {
        return createJsonResponse(companyResponse);
      }

      if (path === '/api/companies/cmp_1/assessments/asm_archived/overview') {
        return createJsonResponse(createArchivedAssessmentOverview());
      }

      if (path === '/api/assessments/asm_archived') {
        assert.equal(init?.method, 'DELETE');

        return createJsonResponse({
          data: {
            cleanupWarnings: [
              'Attachment cleanup was skipped for one retained file.',
              'uploads/evidence/private-storage-key.png',
            ],
          },
        });
      }

      if (path === '/api/assessments?companyId=cmp_1') {
        return createJsonResponse({ data: [] });
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_archived'),
      );

      const { dialog } = await openPermanentDeleteDialog();

      assert.ok(textContent(dialog).includes('4 Threats'));
      assert.ok(textContent(dialog).includes('2 Evidence items'));
      assert.ok(textContent(dialog).includes('1 Report version'));
      assert.ok(textContent(dialog).includes('different from Archive'));

      const confirmButton = findButtonByName('Permanent delete', dialog);
      assert.ok(confirmButton, 'Expected confirm delete button');
      assert.equal(confirmButton.disabled, true);

      const input = document.getElementById(
        'assessment-permanent-delete-confirmation',
      ) as HTMLInputElement | null;
      assert.ok(input, 'Expected exact-name confirmation input');

      await act(async () => {
        fireEvent.change(input!, { target: { value: 'Wrong name' } });
        await renderTick();
      });

      assert.equal(confirmButton.disabled, true);

      await act(async () => {
        fireEvent.change(input!, {
          target: { value: 'Customer Services Portal' },
        });
        await renderTick();
      });

      assert.equal(confirmButton.disabled, false);

      await act(async () => {
        confirmButton.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.equal(window.location.pathname, '/companies/cmp_1/assessments');
      });

      await waitFor(() => {
        assert.ok(
          document.body.textContent?.includes(
            'Attachment cleanup was skipped for one retained file.',
          ),
        );
      });
      assert.equal(
        document.body.textContent?.includes('uploads/evidence/private'),
        false,
        'Expected internal storage paths to stay hidden',
      );
      assert.equal(
        requests.filter(
          request => request === 'DELETE /api/assessments/asm_archived',
        ).length,
        1,
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });

  it('keeps the archived Assessment and confirmation context after a delete failure', async () => {
    setFetch(async (input, init) => {
      const path = String(input);

      if (path === '/api/companies') {
        return createJsonResponse(companyResponse);
      }

      if (path === '/api/companies/cmp_1/assessments/asm_archived/overview') {
        return createJsonResponse(createArchivedAssessmentOverview());
      }

      if (path === '/api/assessments/asm_archived') {
        assert.equal(init?.method, 'DELETE');

        return createJsonResponse(
          {
            error: {
              code: 'ASSESSMENT_DELETE_CONFLICT',
              message:
                'Assessment cannot be deleted while related reports exist',
              details: [],
            },
          },
          { status: 409 },
        );
      }

      throw new Error(`Unexpected request: ${path}`);
    });

    try {
      const { root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_archived'),
      );

      const { dialog } = await openPermanentDeleteDialog();
      const input = document.getElementById(
        'assessment-permanent-delete-confirmation',
      ) as HTMLInputElement | null;
      const confirmButton = findButtonByName('Permanent delete', dialog);

      assert.ok(input, 'Expected exact-name confirmation input');
      assert.ok(confirmButton, 'Expected confirm delete button');

      await act(async () => {
        fireEvent.change(input!, {
          target: { value: 'Customer Services Portal' },
        });
        await renderTick();
      });

      await act(async () => {
        confirmButton!.click();
        await renderTick();
        await renderTick();
      });

      await waitFor(() => {
        assert.ok(
          textContent(dialog).includes(
            'could not be permanently deleted because related records still depend on it',
          ),
        );
      });
      assert.equal(
        window.location.pathname,
        '/companies/cmp_1/assessments/asm_archived/overview',
      );
      assert.equal(input!.value, 'Customer Services Portal');
      assert.ok(document.querySelector('[role="dialog"]'));

      await act(async () => {
        root.unmount();
      });
    } finally {
      restoreFetch();
    }
  });
});
