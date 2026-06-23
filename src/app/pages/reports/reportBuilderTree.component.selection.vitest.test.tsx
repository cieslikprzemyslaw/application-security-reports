import assert from 'node:assert/strict';

import React, { useState } from 'react';
import { describe, it, vi } from 'vitest';

import { renderWithProviders, screen, waitFor } from '~/test/render';

import type { ReportBuilderSelection } from '~/domain';

import { type ReportBuilderSelectionTreeState } from './reportBuilderSelectionTree';
import ReportBuilderTree from './reportBuilderTree.component';
import {
  assessmentId,
  companyId,
  createEmptySelectionState,
  emptySelection,
  evidenceOneId,
  evidenceTwoId,
  populatedHierarchy,
  threatOneId,
  threatTwoId,
} from './reportBuilderTree.testFixtures';

import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

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
  const [includeEvidence, setIncludeEvidence] = useState(false);

  return (
    <>
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        includeEvidence={includeEvidence}
        selection={selection}
        selectionState={selectionState}
        onSelectionChange={(nextState, exactSelection) => {
          setSelectionState(nextState);
          setSelection(exactSelection);
        }}
        onIncludeEvidenceChange={setIncludeEvidence}
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

describe('ReportBuilderTree controlled selection', () => {
  it('propagates parent selection, preserves exclusions, and supports Space', async () => {
    const { user } = renderWithProviders(
      <ControlledTree loadHierarchy={async () => populatedHierarchy} />,
    );

    const assessmentCheckbox = (await screen.findByRole('checkbox', {
      name: /Customer Services Portal/,
    })) as HTMLInputElement;
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

  it('keeps Evidence selection explicit when includeEvidence changes', async () => {
    const { user } = renderWithProviders(
      <ControlledTree loadHierarchy={async () => populatedHierarchy} />,
    );

    const includeEvidenceCheckbox = (await screen.findByRole('checkbox', {
      name: /Include selected evidence/,
    })) as HTMLInputElement;
    const evidenceCheckbox = screen.getByRole('checkbox', {
      name: /Authorization note/,
    }) as HTMLInputElement;

    assert.equal(includeEvidenceCheckbox.checked, false);
    assert.equal(evidenceCheckbox.checked, false);
    assert.deepEqual(readControlledSelection(), emptySelection);

    await user.click(includeEvidenceCheckbox);

    await waitFor(() => {
      assert.equal(includeEvidenceCheckbox.checked, true);
      assert.equal(evidenceCheckbox.checked, false);
    });
    assert.deepEqual(readControlledSelection(), emptySelection);

    await user.click(evidenceCheckbox);

    await waitFor(() => {
      assert.equal(evidenceCheckbox.checked, true);
    });
    assert.deepEqual(readControlledSelection(), {
      selectedThreatIds: [],
      selectedEvidenceIds: [evidenceOneId],
    });

    await user.click(includeEvidenceCheckbox);

    await waitFor(() => {
      assert.equal(includeEvidenceCheckbox.checked, false);
      assert.equal(evidenceCheckbox.checked, true);
    });
    assert.deepEqual(readControlledSelection(), {
      selectedThreatIds: [],
      selectedEvidenceIds: [evidenceOneId],
    });
  });

  it('does not change rendered selection when the parent ignores the callback', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        includeEvidence={false}
        selection={emptySelection}
        selectionState={createEmptySelectionState()}
        onSelectionChange={onSelectionChange}
        onIncludeEvidenceChange={vi.fn()}
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
});
