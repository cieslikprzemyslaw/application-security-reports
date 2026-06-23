import {
  type ReportBuilderConfiguration,
  type ReportBuilderSelection,
  type ReportBuilderState,
} from '~/domain';
import { reportBuilderStateSchema } from '~/domain/schemas';

const normalizeOptionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSelectedIds = (value?: readonly string[]) => {
  if (value === undefined) {
    return undefined;
  }

  return Array.from(new Set(value.map(item => item.trim()).filter(Boolean)));
};

export const updateReportBuilderConfiguration = (
  state: ReportBuilderState,
  patch: Partial<ReportBuilderConfiguration>,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    ...state,
    configuration: {
      ...state.configuration,
      ...(patch.methodology === undefined
        ? {}
        : {
            methodology: normalizeOptionalText(patch.methodology),
          }),
      ...(patch.reportStyle === undefined
        ? {}
        : {
            reportStyle: normalizeOptionalText(patch.reportStyle),
          }),
      ...(patch.includeEvidence === undefined
        ? {}
        : {
            includeEvidence: patch.includeEvidence,
          }),
    },
  });

export const updateReportBuilderSelection = (
  state: ReportBuilderState,
  patch: Partial<ReportBuilderSelection>,
): ReportBuilderState =>
  reportBuilderStateSchema.parse({
    ...state,
    selection: {
      ...state.selection,
      ...(patch.selectedAssessmentId === undefined
        ? {}
        : {
            selectedAssessmentId: normalizeOptionalText(
              patch.selectedAssessmentId,
            ),
          }),
      ...(patch.selectedThreatIds === undefined
        ? {}
        : {
            selectedThreatIds:
              normalizeSelectedIds(patch.selectedThreatIds) ?? [],
          }),
      ...(patch.selectedEvidenceIds === undefined
        ? {}
        : {
            selectedEvidenceIds:
              normalizeSelectedIds(patch.selectedEvidenceIds) ?? [],
          }),
    },
  });
