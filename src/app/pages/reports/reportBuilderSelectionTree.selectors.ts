import type { ReportBuilderSelection, ReportEvidenceSelection } from '~/domain';

import type {
  ReportBuilderNodeSelectionState,
  ReportBuilderSelectionTreeState,
} from './reportBuilderSelectionTree';
import type {
  ReportBuilderHierarchy,
  ReportBuilderHierarchyAssessmentNode,
  ReportBuilderHierarchyEvidenceNode,
  ReportBuilderHierarchyThreatNode,
} from './reportBuilderTree.service';

const unique = (value: readonly string[]) => Array.from(new Set(value));

const evidenceSelectionKey = (
  selection: Pick<ReportEvidenceSelection, 'threatId' | 'evidenceId'>,
) => `${selection.threatId}:${selection.evidenceId}`;

const uniqueEvidenceSelections = (
  value: readonly ReportEvidenceSelection[],
): ReportEvidenceSelection[] =>
  Array.from(
    new Map(value.map(item => [evidenceSelectionKey(item), item])).values(),
  );

const createExactSelection = (): ReportBuilderSelection => ({
  selectedThreatIds: [],
  selectedEvidenceIds: [],
});

const createSelectionContext = (state: ReportBuilderSelectionTreeState) => {
  const selectedThreatIds = new Set(state.selectedThreatIds);
  const selectedEvidenceIds = new Set(state.selectedEvidenceIds);
  const selectedEvidenceSelections = new Set(
    state.selectedEvidenceSelections.map(evidenceSelectionKey),
  );
  const excludedThreatIds = new Set(state.excludedThreatIds);
  const excludedEvidenceSelections = new Set(
    state.excludedEvidenceSelections.map(evidenceSelectionKey),
  );

  return {
    isAssessmentActive(assessmentId: string) {
      return state.selectedAssessmentId === assessmentId;
    },
    isThreatExplicitlySelected(assessmentId: string, threatId: string) {
      return (
        state.selectedAssessmentId === assessmentId &&
        selectedThreatIds.has(threatId) &&
        !excludedThreatIds.has(threatId)
      );
    },
    isEvidenceSelected(
      assessmentId: string,
      threatId: string,
      evidenceId: string,
      threatSelected: boolean,
    ) {
      if (state.selectedAssessmentId !== assessmentId) {
        return false;
      }

      const selectionKey = evidenceSelectionKey({ threatId, evidenceId });
      const explicitlySelected = selectedEvidenceSelections.has(selectionKey);

      if (explicitlySelected) {
        return true;
      }

      if (excludedEvidenceSelections.has(selectionKey)) {
        return false;
      }

      return selectedEvidenceIds.has(evidenceId) || threatSelected;
    },
  };
};

const isThreatSelected = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  threat: ReportBuilderHierarchyThreatNode,
  context: ReturnType<typeof createSelectionContext>,
) =>
  context.isThreatExplicitlySelected(
    assessment.assessment.id,
    threat.threat.id,
  );

const countThreatBranchSelection = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  threat: ReportBuilderHierarchyThreatNode,
  context: ReturnType<typeof createSelectionContext>,
) => {
  const threatSelected = isThreatSelected(assessment, threat, context);
  const evidenceSelectedCount = threat.evidence.reduce(
    (count, evidenceNode) =>
      count +
      (context.isEvidenceSelected(
        assessment.assessment.id,
        threat.threat.id,
        evidenceNode.evidence.id,
        threatSelected,
      )
        ? 1
        : 0),
    0,
  );

  return {
    threatSelected,
    evidenceSelectedCount,
    selectedCount: (threatSelected ? 1 : 0) + evidenceSelectedCount,
    totalCount: 1 + threat.evidence.length,
  };
};

const countAssessmentBranchSelection = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  context: ReturnType<typeof createSelectionContext>,
) => {
  const threatResults = assessment.threats.map(threat =>
    countThreatBranchSelection(assessment, threat, context),
  );
  const selectedCount = threatResults.reduce(
    (count, threatResult) => count + threatResult.selectedCount,
    0,
  );
  const totalCount = assessment.threats.reduce(
    (count, threat) => count + 1 + threat.evidence.length,
    0,
  );

  return { threatResults, selectedCount, totalCount };
};

const countEvidenceBranches = (hierarchy: ReportBuilderHierarchy) => {
  const counts = new Map<string, number>();

  for (const assessment of hierarchy.assessments) {
    for (const threat of assessment.threats) {
      for (const evidence of threat.evidence) {
        counts.set(
          evidence.evidence.id,
          (counts.get(evidence.evidence.id) ?? 0) + 1,
        );
      }
    }
  }

  return counts;
};

export const getReportBuilderExactSelection = (
  state: ReportBuilderSelectionTreeState,
  hierarchy?: ReportBuilderHierarchy,
): ReportBuilderSelection => {
  const exactSelection = createExactSelection();

  if (!hierarchy || !state.selectedAssessmentId) {
    return exactSelection;
  }

  const assessment = hierarchy.assessments.find(
    node => node.assessment.id === state.selectedAssessmentId,
  );

  if (!assessment) {
    return exactSelection;
  }

  const context = createSelectionContext(state);
  const evidenceBranchCounts = countEvidenceBranches(hierarchy);
  const evidenceSelections: ReportEvidenceSelection[] = [];

  exactSelection.selectedAssessmentId = assessment.assessment.id;

  for (const threat of assessment.threats) {
    const threatSelected = isThreatSelected(assessment, threat, context);

    if (threatSelected) {
      exactSelection.selectedThreatIds.push(threat.threat.id);
    }

    for (const evidence of threat.evidence) {
      const evidenceId = evidence.evidence.id;
      const evidenceSelected = context.isEvidenceSelected(
        assessment.assessment.id,
        threat.threat.id,
        evidenceId,
        threatSelected,
      );

      if (!evidenceSelected) {
        continue;
      }

      exactSelection.selectedEvidenceIds.push(evidenceId);

      if ((evidenceBranchCounts.get(evidenceId) ?? 0) > 1) {
        evidenceSelections.push({
          threatId: threat.threat.id,
          evidenceId,
        });
      }
    }
  }

  exactSelection.selectedThreatIds = unique(exactSelection.selectedThreatIds);
  exactSelection.selectedEvidenceIds = unique(
    exactSelection.selectedEvidenceIds,
  );

  if (evidenceSelections.length > 0) {
    exactSelection.selectedEvidenceSelections =
      uniqueEvidenceSelections(evidenceSelections);
  }

  return exactSelection;
};

export const getAssessmentSelectionState = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  state: ReportBuilderSelectionTreeState,
): ReportBuilderNodeSelectionState => {
  const context = createSelectionContext(state);

  if (!context.isAssessmentActive(assessment.assessment.id)) {
    return {
      checked: false,
      indeterminate: false,
    };
  }

  const branchSelection = countAssessmentBranchSelection(assessment, context);

  if (branchSelection.totalCount === 0) {
    return {
      checked: true,
      indeterminate: false,
    };
  }

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

export const getEvidenceSelectionState = (
  assessment: ReportBuilderHierarchyAssessmentNode,
  threat: ReportBuilderHierarchyThreatNode,
  evidence: ReportBuilderHierarchyEvidenceNode,
  state: ReportBuilderSelectionTreeState,
): ReportBuilderNodeSelectionState => {
  const context = createSelectionContext(state);
  const threatSelected = isThreatSelected(assessment, threat, context);

  return {
    checked: context.isEvidenceSelected(
      assessment.assessment.id,
      threat.threat.id,
      evidence.evidence.id,
      threatSelected,
    ),
    indeterminate: false,
  };
};
