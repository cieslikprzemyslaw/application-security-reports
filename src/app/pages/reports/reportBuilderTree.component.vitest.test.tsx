import assert from 'node:assert/strict';

import React, { act, useState } from 'react';
import { describe, it, vi } from 'vitest';

import { renderWithProviders, screen, waitFor } from '~/test/render';

import {
  createReportBuilderSelectionTreeState,
  type ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import ReportBuilderTree from './reportBuilderTree.component';

import type { ReportBuilderSelection } from '~/domain';
import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const otherCompanyId = 'cmp_00000000-0000-0000-0000-000000000002';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatOneId = 'thr_00000000-0000-0000-0000-000000000001';
const threatTwoId = 'thr_00000000-0000-0000-0000-000000000002';
const evidenceOneId = 'evd_00000000-0000-0000-0000-000000000001';
const evidenceTwoId = 'evd_00000000-0000-0000-0000-000000000002';

const emptySelection: ReportBuilderSelection = {
  selectedThreatIds: [],
  selectedEvidenceIds: [],
};

const createEmptySelectionState = () =>
  createReportBuilderSelectionTreeState(emptySelection);

const populatedHierarchy: ReportBuilderHierarchy = {
  companyId,
  assessments: [
    {
      assessment: {
        id: assessmentId,
        companyId,
        name: 'Customer Services Portal',
        applicationName: 'Customer Services Portal',
        type: 'Web App',
        status: 'in-progress',
        findingsCount: 2,
        updatedAt: '2026-06-10T00:00:00.000Z',
        description: 'Assessment of the customer portal',
        scope: 'Web application',
      },
      threats: [
        {
          threat: {
            id: threatOneId,
            assessmentId,
            title: 'Missing Server-Side Authorization',
            description:
              'Authorization is missing on the order lookup endpoint.',
            severity: 'critical',
            strideCategories: ['elevation-of-privilege'],
            status: 'open',
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: evidenceOneId,
                assessmentId,
                threatIds: [threatOneId],
                type: 'text',
                title: 'Authorization note',
                createdAt: '2026-06-05T00:00:00.000Z',
                updatedAt: '2026-06-05T00:00:00.000Z',
              },
            },
          ],
        },
        {
          threat: {
            id: threatTwoId,
            assessmentId,
            title: 'Verbose Error Messages',
            description: 'Unhandled errors disclose stack traces.',
            severity: 'medium',
            strideCategories: ['information-disclosure'],
            status: 'mitigated',
            createdAt: '2026-06-04T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: evidenceTwoId,
                assessmentId,
                threatIds: [threatTwoId],
                type: 'http',
                title: 'HTTP exchange evidence',
                createdAt: '2026-06-06T00:00:00.000Z',
                updatedAt: '2026-06-06T00:00:00.000Z',
              },
            },
          ],
        },
      ],
    },
  ],
};

const otherHierarchy: ReportBuilderHierarchy = {
  companyId: otherCompanyId,
  assessments: [
    {
      assessment: {
        id: 'asm_00000000-0000-0000-0000-000000000002',
        companyId: otherCompanyId,
        name: 'Second Company Portal',
        applicationName: 'Second Company Portal',
        type: 'Web App',
        status: 'draft',
        findingsCount: 0,
        updatedAt: '2026-06-15T00:00:00.000Z',
      },
      threats: [],
    },
  ],
};

interface ControlledTreeProps {
  loadHierarchy: (
    companyId: string,
    signal?: AbortSignal,
  ) => Promise<ReportBuilderHierarchy>;
}

const ControlledTree = ({ loadHierarchy }: ControlledTreeProps) => {
  const [selection, setSelection] =
    useState<ReportBuilderSelection>(emptySelection);
  const [selectionState, setSelectionState] =
    useState<ReportBuilderSelectionTreeState>(createEmptySelectionState);

  return (
    <>
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        selection={selection}
        selectionState={selectionState}
        onSelectionChange={(nextState, exactSelection) => {
          setSelectionState(nextState);
          setSelection(exactSelection);
        }}
        loadHierarchy={loadHierarchy}
      />

      <output data-testid="controlled-selection">
        {JSON.stringify(selection)}
      </output>
    </>
  );
};

const readControlledSelection = () =>
  JSON.parse(
    screen.getByTestId('controlled-selection').textContent ?? '{}',
  ) as ReportBuilderSelection;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

describe('ReportBuilderTree', () => {
  it('shows loading and aborts the request when unmounted', async () => {
    const pendingHierarchy = createDeferred<ReportBuilderHierarchy>();
    let signal: AbortSignal | undefined;

    const { unmount } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={vi.fn()}
        loadHierarchy={(_companyId, nextSignal) => {
          signal = nextSignal;
          return pendingHierarchy.promise;
        }}
      />,
    );

    assert.ok(
      screen
        .getByRole('status')
        .textContent?.includes('Loading company hierarchy'),
    );

    await waitFor(() => {
      assert.ok(signal);
    });

    unmount();

    assert.equal(signal?.aborted, true);
  });

  it('renders an error, retries, and then renders the empty state', async () => {
    const loadHierarchy = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unable to reach API'))
      .mockResolvedValueOnce({
        companyId,
        assessments: [],
      } satisfies ReportBuilderHierarchy);

    const { user } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={vi.fn()}
        loadHierarchy={loadHierarchy}
      />,
    );

    await waitFor(() => {
      assert.ok(
        screen.getByRole('alert').textContent?.includes('Unable to reach API'),
      );
    });

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      assert.ok(screen.getByText('No assessments yet'));
    });

    assert.equal(loadHierarchy.mock.calls.length, 2);
  });

  it('propagates parent selection, preserves exclusions, and supports Space', async () => {
    const { user } = renderWithProviders(
      <ControlledTree loadHierarchy={async () => populatedHierarchy} />,
    );

    await waitFor(() => {
      assert.ok(
        screen.getByRole('checkbox', {
          name: /Customer Services Portal/,
        }),
      );
    });

    const assessmentCheckbox = screen.getByRole('checkbox', {
      name: /Customer Services Portal/,
    }) as HTMLInputElement;
    const threatOneCheckbox = screen.getByRole('checkbox', {
      name: /Missing Server-Side Authorization/,
    }) as HTMLInputElement;
    const threatTwoCheckbox = screen.getByRole('checkbox', {
      name: /Verbose Error Messages/,
    }) as HTMLInputElement;
    const evidenceOneCheckbox = screen.getByRole('checkbox', {
      name: /Authorization note/,
    }) as HTMLInputElement;
    const evidenceTwoCheckbox = screen.getByRole('checkbox', {
      name: /HTTP exchange evidence/,
    }) as HTMLInputElement;

    await user.click(assessmentCheckbox);

    await waitFor(() => {
      assert.equal(assessmentCheckbox.checked, true);
      assert.equal(threatOneCheckbox.checked, true);
      assert.equal(threatTwoCheckbox.checked, true);
      assert.equal(evidenceOneCheckbox.checked, true);
      assert.equal(evidenceTwoCheckbox.checked, true);
    });

    assert.deepEqual(readControlledSelection(), {
      selectedAssessmentId: assessmentId,
      selectedThreatIds: [threatOneId, threatTwoId],
      selectedEvidenceIds: [evidenceOneId, evidenceTwoId],
    });

    await user.click(evidenceOneCheckbox);

    await waitFor(() => {
      assert.equal(assessmentCheckbox.checked, false);
      assert.equal(assessmentCheckbox.indeterminate, true);
      assert.equal(threatOneCheckbox.checked, false);
      assert.equal(threatOneCheckbox.indeterminate, true);
      assert.equal(threatTwoCheckbox.checked, true);
      assert.equal(evidenceOneCheckbox.checked, false);
      assert.equal(evidenceTwoCheckbox.checked, true);
    });

    assert.deepEqual(readControlledSelection(), {
      selectedAssessmentId: assessmentId,
      selectedThreatIds: [threatOneId, threatTwoId],
      selectedEvidenceIds: [evidenceTwoId],
    });

    threatTwoCheckbox.focus();
    await user.keyboard('[Space]');

    await waitFor(() => {
      assert.equal(threatTwoCheckbox.checked, false);
      assert.equal(evidenceTwoCheckbox.checked, false);
    });

    assert.deepEqual(readControlledSelection(), {
      selectedAssessmentId: assessmentId,
      selectedThreatIds: [threatOneId],
      selectedEvidenceIds: [],
    });
  });

  it('does not change its rendered selection when the parent ignores the callback', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={onSelectionChange}
        loadHierarchy={async () => populatedHierarchy}
      />,
    );

    const assessmentCheckbox = (await screen.findByRole('checkbox', {
      name: /Customer Services Portal/,
    })) as HTMLInputElement;

    await user.click(assessmentCheckbox);

    await waitFor(() => {
      assert.equal(onSelectionChange.mock.calls.length, 1);
      assert.equal(assessmentCheckbox.checked, false);
    });

    const [nextState, exactSelection] = onSelectionChange.mock.calls[0] as [
      ReportBuilderSelectionTreeState,
      ReportBuilderSelection,
    ];

    assert.equal(nextState.selectedAssessmentId, assessmentId);
    assert.deepEqual(exactSelection, {
      selectedAssessmentId: assessmentId,
      selectedThreatIds: [threatOneId, threatTwoId],
      selectedEvidenceIds: [evidenceOneId, evidenceTwoId],
    });
  });

  it('aborts stale company loads and ignores their late results', async () => {
    const first = createDeferred<ReportBuilderHierarchy>();
    const second = createDeferred<ReportBuilderHierarchy>();
    let firstSignal: AbortSignal | undefined;

    const loadHierarchy = vi.fn(
      (requestedCompanyId: string, signal?: AbortSignal) => {
        if (requestedCompanyId === companyId) {
          firstSignal = signal;
          return first.promise;
        }

        if (requestedCompanyId === otherCompanyId) {
          return second.promise;
        }

        throw new Error(`Unexpected company: ${requestedCompanyId}`);
      },
    );

    const { rerender } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={vi.fn()}
        loadHierarchy={loadHierarchy}
      />,
    );

    await waitFor(() => {
      assert.equal(loadHierarchy.mock.calls.length, 1);
    });

    rerender(
      <ReportBuilderTree
        companyId={otherCompanyId}
        companyName="Second Company"
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={vi.fn()}
        loadHierarchy={loadHierarchy}
      />,
    );

    await waitFor(() => {
      assert.equal(firstSignal?.aborted, true);
      assert.equal(loadHierarchy.mock.calls.length, 2);
    });

    await act(async () => {
      second.resolve(otherHierarchy);
      await second.promise;
    });

    await waitFor(() => {
      assert.ok(screen.getByText('Second Company Portal'));
    });

    await act(async () => {
      first.resolve(populatedHierarchy);
      await first.promise;
    });

    assert.equal(screen.queryByText('Customer Services Portal'), null);
    assert.ok(screen.getByText('Second Company Portal'));
  });
});
