import assert from 'node:assert/strict';

import React, { act } from 'react';
import { describe, it, vi } from 'vitest';

import { renderWithProviders, screen, waitFor } from '~/test/render';

import ReportBuilderTree from './reportBuilderTree.component';
import {
  companyId,
  createDeferred,
  createEmptySelectionState,
  emptySelection,
  otherCompanyId,
  otherHierarchy,
  populatedHierarchy,
} from './reportBuilderTree.testFixtures';

import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

describe('ReportBuilderTree async states', () => {
  it('shows loading and aborts the request when unmounted', async () => {
    const pendingHierarchy = createDeferred<ReportBuilderHierarchy>();
    let signal: AbortSignal | undefined;

    const { unmount } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        includeEvidence={false}
        onIncludeEvidenceChange={vi.fn()}
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
        includeEvidence={false}
        onIncludeEvidenceChange={vi.fn()}
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
        includeEvidence={false}
        onIncludeEvidenceChange={vi.fn()}
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
        includeEvidence={false}
        onIncludeEvidenceChange={vi.fn()}
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
