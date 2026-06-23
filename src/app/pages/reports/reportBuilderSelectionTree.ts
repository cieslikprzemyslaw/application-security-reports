import type { ReportBuilderSelection } from '~/domain';

import type {
  ReportBuilderHierarchy,
  ReportBuilderHierarchyAssessmentNode,
  ReportBuilderHierarchyThreatNode,
} from './reportBuilderTree.service';

export interface ReportBuilderSelectionTreeState {
  selectedAssessmentId?: string;
  selectedThreatIds: string[];
  selectedEvidenceIds: string[];
  excludedThreatIds: string[];
  excludedEvidenceIds: string[];
}

export interface ReportBuilderNodeSelectionState {
  checked: boolean;
  indeterminate: boolean;
}

const unique = (value: readonly string[]) => Array.from(new Set(value));

const removeId = (value: readonly string[], id: string) =>
  value.filter(item => item !== id);

const createExactSelection = (): ReportBuilderSelection => ({
  selectedThreatIds: [],
  selectedEvidenceIds: [],
});

export const createReportBuilderSelectionTreeState = (
  initialSelection?: Partial<ReportBuilderSelection>,
): ReportBuilderSelectionTreeState => ({
  selectedAssessmentId: initialSelection?.selectedAssessmentId,
  selectedThreatIds: unique(initialSelection?.selectedThreatIds ?? []),
  selectedEvidenceIds: unique(initialSelection?.selectedEvidenceIds ?? []),
  excludedThreatIds: [],
  excludedEvidenceIds: [],
});

export const toggleReportBuilderAssessmentSelection = (
  state: ReportBuilderSelectionTreeState,
  assessmentId: string,
  selected: boolean,
): ReportBuilderSelectionTreeState => ({
  ...state,
  selectedAssessmentId: selected
    ? assessmentId
    : state.selectedAssessmentId === assessmentId
      ? undefined
      : state.selectedAssessmentId,
});

export const toggleReportBuilderThreatSelection = (
  state: ReportBuilderSelectionTreeState,
  threatId: string,
  selected: boolean,
): ReportBuilderSelectionTreeState => ({
  ...state,
  selectedThreatIds: selected
    ? unique([...state.selectedThreatIds, threatId])
    : removeId(state.selectedThreatIds, threatId),
  excludedThreatIds: selected
    ? removeId(state.excludedThreatIds, threatId)
    : unique([...state.excludedThreatIds, threatId]),
});

export const toggleReportBuilderEvidenceSelection = (
  state: ReportBuilderSelectionTreeState,
  evidenceId: string,
  selected: boolean,
): ReportBuilderSelectionTreeState => ({
  ...state,
  selectedEvidenceIds: selected
    ? unique([...state.selectedEvidenceIds, evidenceId])
    : removeId(state.selectedEvidenceIds, evidenceId),
  excludedEvidenceIds: selected
    ? removeId(state.excludedEvidenceIds, evidenceId)
    : unique([...state.excludedEvidenceIds, evidenceId]),
});

const createSelectionContext = (state: ReportBuilderSelectionTreeState) => {
  const selectedThreatIds = new Set(state.selectedThreatIds);
  const selectedEvidenceIds = new Set(state.selectedEvidenceIds);
  const excludedThreatIds = new Set(state.excludedThreatIds);
  const excludedEvidenceIds = new Set(state.excludedEvidenceIds);

  return {
    isAssessmentSelected(assessmentId: string) {
      return state.selectedAssessmentId === assessmentId;
    },
    isThreatExplicitlySelected(threatId: string) {
      return selectedThreatIds.has(threatId);
    },
    isThreatExcluded(threatId: string) {
      return excludedThreatIds.has(threatId);
    },
    isEvidenceExplicitlySelected(evidenceId: string) {
      return selectedEvidenceIds.has(evidenceId);
    },
    isEvidenceExcluded(evidenceId: string) {
      return excludedEvidenceIds.has(evidenceId);
    },
  };
};

const countThreatBranchSelection = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  threat: ReportBuilderHierarchyThreatNode,
  context: ReturnType<typeof createSelectionContext>,
) => {
  const threatSelected =
    (context.isAssessmentSelected(assessment.assessment.id) &&
      !context.isThreatExcluded(threat.threat.id)) ||
    context.isThreatExplicitlySelected(threat.threat.id);

  const evidenceSelectedCount = threat.evidence.reduce(
    (count, evidenceNode) => {
      const evidenceSelected =
        !context.isEvidenceExcluded(evidenceNode.evidence.id) &&
        (context.isEvidenceExplicitlySelected(evidenceNode.evidence.id) ||
          threatSelected);

      return count + (evidenceSelected ? 1 : 0);
    },
    0,
  );

  const selectedCount = (threatSelected ? 1 : 0) + evidenceSelectedCount;
  const totalCount = 1 + threat.evidence.length;

  return {
    threatSelected,
    evidenceSelectedCount,
    selectedCount,
    totalCount,
  };
};

const countAssessmentBranchSelection = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  context: ReturnType<typeof createSelectionContext>,
) => {
  const threatResults = assessment.threats.map(threat =>
    countThreatBranchSelection(assessment, threat, context),
  );

  const selectedCount =
    (context.isAssessmentSelected(assessment.assessment.id) ? 1 : 0) +
    threatResults.reduce(
      (count, threatResult) => count + threatResult.selectedCount,
      0,
    );
  const totalCount =
    1 +
    assessment.threats.reduce(
      (count, threat) => count + 1 + threat.evidence.length,
      0,
    );

  return {
    threatResults,
    selectedCount,
    totalCount,
  };
};

export const getReportBuilderExactSelection = (
  state: ReportBuilderSelectionTreeState,
  hierarchy?: ReportBuilderHierarchy,
): ReportBuilderSelection => {
  const exactSelection = createExactSelection();

  if (!hierarchy) {
    return exactSelection;
  }

  const context = createSelectionContext(state);

  for (const assessment of hierarchy.assessments) {
    if (context.isAssessmentSelected(assessment.assessment.id)) {
      exactSelection.selectedAssessmentId = assessment.assessment.id;
    }

    for (const threat of assessment.threats) {
      const threatSelected =
        (context.isAssessmentSelected(assessment.assessment.id) &&
          !context.isThreatExcluded(threat.threat.id)) ||
        context.isThreatExplicitlySelected(threat.threat.id);

      if (threatSelected) {
        exactSelection.selectedThreatIds.push(threat.threat.id);
      }

      for (const evidence of threat.evidence) {
        const evidenceSelected =
          !context.isEvidenceExcluded(evidence.evidence.id) &&
          (context.isEvidenceExplicitlySelected(evidence.evidence.id) ||
            threatSelected);

        if (evidenceSelected) {
          exactSelection.selectedEvidenceIds.push(evidence.evidence.id);
        }
      }
    }
  }

  exactSelection.selectedThreatIds = unique(exactSelection.selectedThreatIds);
  exactSelection.selectedEvidenceIds = unique(
    exactSelection.selectedEvidenceIds,
  );

  return exactSelection;
};

export const getAssessmentSelectionState = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  state: ReportBuilderSelectionTreeState,
): ReportBuilderNodeSelectionState => {
  const context = createSelectionContext(state);
  const branchSelection = countAssessmentBranchSelection(assessment, context);

  return {
    checked: branchSelection.selectedCount === branchSelection.totalCount,
    indeterminate:
      branchSelection.selectedCount > 0 &&
      branchSelection.selectedCount < branchSelection.totalCount,
  };
};

export const getThreatSelectionState = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  threat: ReportBuilderHierarchyThreatNode,
  state: ReportBuilderSelectionTreeState,
): ReportBuilderNodeSelectionState => {
  const context = createSelectionContext(state);
  const branchSelection = countThreatBranchSelection(
    assessment,
    threat,
    context,
  );

  const allEvidenceSelected =
    branchSelection.evidenceSelectedCount === threat.evidence.length;
  const fullySelected = branchSelection.threatSelected && allEvidenceSelected;
  const partiallySelected =
    branchSelection.threatSelected || branchSelection.evidenceSelectedCount > 0;

  return {
    checked: fullySelected,
    indeterminate: partiallySelected && !fullySelected,
  };
};
