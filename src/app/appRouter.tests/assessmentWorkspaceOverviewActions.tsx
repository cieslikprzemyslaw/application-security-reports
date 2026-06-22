import {
  act,
  assert,
  createJsonResponse,
  renderApp,
  renderTick,
  restoreFetch,
  routes,
  setFetch,
  setupAssessmentWorkspaceFetchFixture,
  textContent,
  waitFor,
} from './support';

type CompleteOutcome = 'conflict' | 'error' | 'success';

const completeCommandPath =
  '/api/companies/cmp_1/assessments/asm_1/commands/complete';

const setupCompleteOutcome = (outcome: CompleteOutcome) => {
  setupAssessmentWorkspaceFetchFixture();

  if (outcome === 'conflict') {
    return;
  }

  const baseFetch = globalThis.fetch;

  setFetch(async (input, init) => {
    if (String(input) !== completeCommandPath) {
      return baseFetch(input, init);
    }

    if (outcome === 'error') {
      return createJsonResponse(
        {
          error: {
            code: 'ASSESSMENT_UPDATE_FAILED',
            message: 'Unable to complete assessment.',
            details: [],
          },
        },
        { status: 500 },
      );
    }

    return createJsonResponse({
      data: {
        company: {
          id: 'cmp_1',
          name: 'Northwind Labs',
        },
        assessment: {
          id: 'asm_1',
          companyId: 'cmp_1',
          title: 'Customer Services Portal',
          description: 'Assessment of the customer portal',
          scope: 'Web application',
          status: 'completed',
          startedAt: '2026-06-01',
          completedAt: '2026-06-22',
          applicationName: 'Customer Services Portal',
          environment: 'Production',
          assessmentType: 'Web App',
          overallRisk: 'high',
          createdAt: '2026-06-01T09:00:00.000Z',
          updatedAt: '2026-06-22T09:00:00.000Z',
          recordVersion: 4,
          findingsCount: 14,
          evidenceCount: 1,
          reportVersionCount: 2,
          testerName: 'Alex Mercer',
          availableActions: ['reopen', 'archive'],
        },
      },
    });
  });
};

const findButton = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(button =>
    button.textContent?.includes(label),
  ) as HTMLButtonElement | undefined;

const getStatusText = (container: HTMLElement) =>
  container.querySelector('.assessment-summary-badges')?.textContent ?? '';

const clickAction = async (button: HTMLButtonElement) => {
  await act(async () => {
    button.dispatchEvent(
      new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );
    await renderTick();
    await renderTick();
  });
};

const assertInProgressState = (container: HTMLElement) => {
  assert.ok(getStatusText(container).includes('In Progress'));
  assert.ok(findButton(container, 'Complete'));
  assert.equal(findButton(container, 'Reopen'), undefined);
};

export const runAssessmentWorkspaceOverviewActionTests = async () => {
  try {
    {
      setupAssessmentWorkspaceFetchFixture();

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.equal(
        textContent(container).includes('asm_1'),
        false,
        'Expected the Assessment ID to stay hidden from the UI',
      );
      assert.equal(
        container.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
        'Assessment sections',
      );
      assert.equal(
        window.location.pathname,
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );
      assertInProgressState(container);

      await act(async () => {
        root.unmount();
      });
    }

    {
      setupCompleteOutcome('success');

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      const completeButton = findButton(container, 'Complete');

      assert.ok(completeButton, 'Expected a complete action');
      await clickAction(completeButton!);

      await waitFor(() => {
        assert.ok(getStatusText(container).includes('Completed'));
        assert.ok(findButton(container, 'Reopen'));
      });

      assert.equal(findButton(container, 'Complete'), undefined);
      assert.equal(
        textContent(container).includes('Unable to update assessment'),
        false,
      );
      assert.equal(
        textContent(container).includes('Assessment changed elsewhere'),
        false,
      );

      await act(async () => {
        root.unmount();
      });
    }

    {
      setupCompleteOutcome('error');

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      const completeButton = findButton(container, 'Complete');

      assert.ok(completeButton, 'Expected a complete action');
      await clickAction(completeButton!);

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Unable to update assessment'),
        );
        assert.ok(
          textContent(container).includes('Unable to complete assessment.'),
        );
      });

      assertInProgressState(container);

      await act(async () => {
        root.unmount();
      });
    }

    {
      setupCompleteOutcome('conflict');

      const { container, root } = await renderApp(
        routes.assessmentDetailsOverview('cmp_1', 'asm_1'),
      );
      const completeButton = findButton(container, 'Complete');

      assert.ok(completeButton, 'Expected a complete action');
      await clickAction(completeButton!);

      await waitFor(() => {
        assert.ok(
          textContent(container).includes('Assessment changed elsewhere'),
        );
      });

      assertInProgressState(container);

      await act(async () => {
        root.unmount();
      });
    }

    {
      setupAssessmentWorkspaceFetchFixture();

      const { container, root } = await renderApp(
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );

      assert.ok(textContent(container).includes('Customer Services Portal'));
      assert.equal(
        window.location.pathname,
        routes.assessmentDetails('cmp_1', 'asm_1'),
      );
      assert.equal(
        container.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
        'Overview',
      );

      await act(async () => {
        root.unmount();
      });
    }
  } finally {
    restoreFetch();
  }
};
