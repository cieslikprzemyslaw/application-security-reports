import assert from 'node:assert/strict';

import React from 'react';
import { describe, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/test/render';

import {
  createReportBuilderSelectionTreeState,
  getReportBuilderExactSelection,
} from './reportBuilderSelectionTree';
import ReportBuilderTree from './reportBuilderTree.component';
import {
  companyId,
  populatedHierarchy,
} from './reportBuilderTree.testFixtures';

describe('ReportBuilderTree assessment accordions', () => {
  it('collapses and expands an Assessment without changing selection', async () => {
    const selectionState = createReportBuilderSelectionTreeState();
    const selection = getReportBuilderExactSelection(
      selectionState,
      populatedHierarchy,
    );
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        includeEvidence={false}
        selection={selection}
        selectionState={selectionState}
        onSelectionChange={onSelectionChange}
        onIncludeEvidenceChange={vi.fn()}
        loadHierarchy={async () => populatedHierarchy}
      />,
    );

    const collapseButton = await screen.findByRole('button', {
      name: 'Collapse Customer Services Portal',
    });

    assert.ok(
      screen.getByRole('checkbox', {
        name: /Missing Server-Side Authorization/,
      }),
    );

    await user.click(collapseButton);

    assert.equal(
      screen.queryByRole('checkbox', {
        name: /Missing Server-Side Authorization/,
      }),
      null,
    );
    assert.equal(onSelectionChange.mock.calls.length, 0);

    const expandButton = screen.getByRole('button', {
      name: 'Expand Customer Services Portal',
    });

    await user.click(expandButton);

    assert.ok(
      screen.getByRole('checkbox', {
        name: /Missing Server-Side Authorization/,
      }),
    );
    assert.equal(onSelectionChange.mock.calls.length, 0);
  });
});
