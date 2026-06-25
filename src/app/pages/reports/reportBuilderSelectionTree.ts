import type { ReportBuilderSelection, ReportEvidenceSelection } from '~/domain';

import type { ReportBuilderHierarchyAssessmentNode } from './reportBuilderTree.service';

export interface ReportBuilderSelectionTreeState {
  selectedAssessmentId?: string;
  selectedThreatIds: string[];
  selectedEvidenceIds: string[];
  selectedEvidenceSelections: ReportEvidenceSelection[];
  excludedThreatIds: string[];
  excludedEvidenceSelections: ReportEvidenceSelection[];
}

export interface ReportBuilderNodeSelectionState {
  checked: boolean;
  indeterminate: boolean;
}

const unique = (value: readonly string[]) => Array.from(new Set(value));

const removeIds = (value: readonly string[], ids: ReadonlySet<string>) =>
  value.filter(item => !ids.has(item));

const evidenceSelectionKey = (
  selection: Pick<ReportEvidenceSelection, 'threatId' | 'evidenceId'>,
) => `${selection.threatId}:${selection.evidenceId}`;

const uniqueEvidenceSelections = (
  value: readonly ReportEvidenceSelection[],
): ReportEvidenceSelection[] =>
  Array.from(
    new Map(value.map(item => [evidenceSelectionKey(item), item])).values(),
  );

const removeEvidenceSelection = (
  value: readonly ReportEvidenceSelection[],
  selection: ReportEvidenceSelection,
) =>
  value.filter(
    item => evidenceSelectionKey(item) !== evidenceSelectionKey(selection),
  );

const switchAssessmentContext = (
  state: ReportBuilderSelectionTreeState,
  assessmentId: string,
  lockedAssessmentId?: string,
): ReportBuilderSelectionTreeState => {
  if (lockedAssessmentId && lockedAssessmentId !== assessmentId) {
    return state;
  }

  if (
    state.selectedAssessmentId === undefined ||
    state.selectedAssessmentId === assessmentId
  ) {
    return {
      ...state,
      selectedAssessmentId: assessmentId,
    };
  }

  return {
    selectedAssessmentId: assessmentId,
    selectedThreatIds: [],
    selectedEvidenceIds: [],
    selectedEvidenceSelections: [],
    excludedThreatIds: [],
    excludedEvidenceSelections: [],
  };
};

export const createReportBuilderSelectionTreeState = (
  initialSelection?: Partial<ReportBuilderSelection>,
): ReportBuilderSelectionTreeState => {
  const selectedEvidenceSelections = uniqueEvidenceSelections(
    initialSelection?.selectedEvidenceSelections ?? [],
  );
  const scopedEvidenceIds = new Set(
    selectedEvidenceSelections.map(item => item.evidenceId),
  );

  return {
    selectedAssessmentId: initialSelection?.selectedAssessmentId,
    selectedThreatIds: unique(initialSelection?.selectedThreatIds ?? []),
    selectedEvidenceIds: unique(
      (initialSelection?.selectedEvidenceIds ?? []).filter(
        evidenceId => !scopedEvidenceIds.has(evidenceId),
      ),
    ),
    selectedEvidenceSelections,
    excludedThreatIds: [],
    excludedEvidenceSelections: [],
  };
};

export const toggleReportBuilderAssessmentSelection = (
  state: ReportBuilderSelectionTreeState,
  assessment: ReportBuilderHierarchyAssessmentNode,
  selected: boolean,
  lockedAssessmentId?: string,
): ReportBuilderSelectionTreeState => {
  const assessmentId = assessment.assessment.id;

  if (
    lockedAssessmentId &&
    (lockedAssessmentId !== assessmentId || !selected)
  ) {
    return state;
  }
  const descendantThreatIds = new Set(
    assessment.threats.map(node => node.threat.id),
  );

  if (!selected) {
    return {
      ...state,
      selectedAssessmentId:
        state.selectedAssessmentId === assessmentId
          ? undefined
          : state.selectedAssessmentId,
      selectedThreatIds: removeIds(
        state.selectedThreatIds,
        descendantThreatIds,
      ),
    };
  }

  const contextualState = switchAssessmentContext(
    state,
    assessmentId,
    lockedAssessmentId,
  );
  const excludedThreatIds = new Set(contextualState.excludedThreatIds);
  const selectableThreatIds = assessment.threats
    .map(node => node.threat.id)
    .filter(threatId => !excludedThreatIds.has(threatId));

  return {
    ...contextualState,
    selectedThreatIds: unique([
      ...contextualState.selectedThreatIds,
      ...selectableThreatIds,
    ]),
  };
};

export const toggleReportBuilderThreatSelection = (
  state: ReportBuilderSelectionTreeState,
  assessmentId: string,
  threatId: string,
  selected: boolean,
  lockedAssessmentId?: string,
): ReportBuilderSelectionTreeState => {
  if (lockedAssessmentId && lockedAssessmentId !== assessmentId) {
    return state;
  }

  const contextualState = switchAssessmentContext(
    state,
    assessmentId,
    lockedAssessmentId,
  );

  return {
    ...contextualState,
    selectedThreatIds: selected
      ? unique([...contextualState.selectedThreatIds, threatId])
      : contextualState.selectedThreatIds.filter(item => item !== threatId),
    excludedThreatIds: selected
      ? contextualState.excludedThreatIds.filter(item => item !== threatId)
      : unique([...contextualState.excludedThreatIds, threatId]),
  };
};

export const toggleReportBuilderEvidenceSelection = (
  state: ReportBuilderSelectionTreeState,
  assessmentId: string,
  threatId: string,
  evidenceId: string,
  selected: boolean,
  lockedAssessmentId?: string,
): ReportBuilderSelectionTreeState => {
  if (lockedAssessmentId && lockedAssessmentId !== assessmentId) {
    return state;
  }

  const contextualState = switchAssessmentContext(
    state,
    assessmentId,
    lockedAssessmentId,
  );
  const selection = { threatId, evidenceId };

  return {
    ...contextualState,
    selectedEvidenceSelections: selected
      ? uniqueEvidenceSelections([
          ...contextualState.selectedEvidenceSelections,
          selection,
        ])
      : removeEvidenceSelection(
          contextualState.selectedEvidenceSelections,
          selection,
        ),
    excludedEvidenceSelections: selected
      ? removeEvidenceSelection(
          contextualState.excludedEvidenceSelections,
          selection,
        )
      : uniqueEvidenceSelections([
          ...contextualState.excludedEvidenceSelections,
          selection,
        ]),
  };
};

export {
  getAssessmentSelectionState,
  getEvidenceSelectionState,
  getReportBuilderExactSelection,
  getThreatSelectionState,
} from './reportBuilderSelectionTree.selectors';
