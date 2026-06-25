import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  createReportBuilderSelectionTreeState,
  getAssessmentSelectionState,
  getReportBuilderExactSelection,
  getThreatSelectionState,
  toggleReportBuilderAssessmentSelection,
  toggleReportBuilderEvidenceSelection,
  toggleReportBuilderThreatSelection,
} from './reportBuilderSelectionTree';
import {
  assessmentId,
  evidenceOneId,
  evidenceTwoId,
  otherHierarchy,
  populatedHierarchy,
  threatOneId,
  threatTwoId,
} from './reportBuilderTree.testFixtures';

describe('reportBuilderSelectionTree helpers', () => {
  it('propagates parent selection and preserves explicit exclusions across parent changes', () => {
    const assessment = populatedHierarchy.assessments[0]!;
    let state = createReportBuilderSelectionTreeState();

    state = toggleReportBuilderAssessmentSelection(state, assessment, true);
    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatOneId, threatTwoId],
        selectedEvidenceIds: [evidenceOneId, evidenceTwoId],
      },
    );

    state = toggleReportBuilderEvidenceSelection(
      state,
      assessmentId,
      threatOneId,
      evidenceOneId,
      false,
    );
    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatOneId, threatTwoId],
        selectedEvidenceIds: [evidenceTwoId],
      },
    );

    state = toggleReportBuilderThreatSelection(
      state,
      assessmentId,
      threatTwoId,
      false,
    );
    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatOneId],
        selectedEvidenceIds: [],
      },
    );

    state = toggleReportBuilderAssessmentSelection(state, assessment, false);
    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedThreatIds: [],
        selectedEvidenceIds: [],
      },
    );

    state = toggleReportBuilderAssessmentSelection(state, assessment, true);
    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatOneId],
        selectedEvidenceIds: [],
      },
    );
  });

  it('keeps a persisted Report locked to its original Assessment', () => {
    const assessment = populatedHierarchy.assessments[0]!;
    const otherAssessment = otherHierarchy.assessments[0]!;
    const selectedState = toggleReportBuilderThreatSelection(
      createReportBuilderSelectionTreeState(),
      assessmentId,
      threatOneId,
      true,
    );

    assert.equal(
      toggleReportBuilderAssessmentSelection(
        selectedState,
        assessment,
        false,
        assessmentId,
      ),
      selectedState,
    );
    assert.equal(
      toggleReportBuilderAssessmentSelection(
        selectedState,
        otherAssessment,
        true,
        assessmentId,
      ),
      selectedState,
    );
    assert.equal(
      toggleReportBuilderThreatSelection(
        selectedState,
        otherAssessment.assessment.id,
        'thr_00000000-0000-0000-0000-000000000099',
        true,
        assessmentId,
      ),
      selectedState,
    );
  });

  it('establishes Assessment context from a selected Threat without selecting siblings', () => {
    const state = toggleReportBuilderThreatSelection(
      createReportBuilderSelectionTreeState(),
      assessmentId,
      threatOneId,
      true,
    );

    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatOneId],
        selectedEvidenceIds: [evidenceOneId],
      },
    );
  });

  it('establishes Assessment context from selected Evidence without selecting its Threat or siblings', () => {
    const state = toggleReportBuilderEvidenceSelection(
      createReportBuilderSelectionTreeState(),
      assessmentId,
      threatOneId,
      evidenceOneId,
      true,
    );

    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [],
        selectedEvidenceIds: [evidenceOneId],
      },
    );
  });

  it('ignores unknown ids that are not present in the loaded hierarchy', () => {
    const state = createReportBuilderSelectionTreeState({
      selectedAssessmentId: 'asm_00000000-0000-0000-0000-000000000099',
      selectedThreatIds: [
        'thr_00000000-0000-0000-0000-000000000099',
        'thr_00000000-0000-0000-0000-000000000099',
      ],
      selectedEvidenceIds: ['evd_00000000-0000-0000-0000-000000000099'],
    });

    assert.deepEqual(
      getReportBuilderExactSelection(state, populatedHierarchy),
      {
        selectedThreatIds: [],
        selectedEvidenceIds: [],
      },
    );
  });

  it('marks a selected branch as partial when evidence is explicitly excluded', () => {
    const assessment = populatedHierarchy.assessments[0]!;
    const threat = assessment.threats[0]!;
    const evidence = threat.evidence[0]!;

    let state = createReportBuilderSelectionTreeState();
    state = toggleReportBuilderAssessmentSelection(state, assessment, true);
    state = toggleReportBuilderEvidenceSelection(
      state,
      assessment.assessment.id,
      threat.threat.id,
      evidence.evidence.id,
      false,
    );

    assert.deepEqual(getThreatSelectionState(assessment, threat, state), {
      checked: false,
      indeterminate: true,
    });
    assert.deepEqual(getAssessmentSelectionState(assessment, state), {
      checked: false,
      indeterminate: true,
    });
  });
});
