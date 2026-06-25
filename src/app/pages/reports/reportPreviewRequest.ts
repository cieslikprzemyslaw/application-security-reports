import type { ReportBuilderState, ReportPreviewRequest } from '~/domain';
import {
  reportBuilderStateSchema,
  reportPreviewRequestSchema,
} from '~/domain/schemas';

export const createReportPreviewRequest = (
  value: ReportBuilderState,
): ReportPreviewRequest | null => {
  const state = reportBuilderStateSchema.parse(value);
  const assessmentId = state.selection.selectedAssessmentId;

  if (!assessmentId) {
    return null;
  }

  const evidenceSelections = state.selection.selectedEvidenceSelections;

  return reportPreviewRequestSchema.parse({
    companyId: state.companyId,
    assessmentId,
    selection: {
      threatIds: [...state.selection.selectedThreatIds],
      evidenceIds: [...state.selection.selectedEvidenceIds],
      ...(evidenceSelections?.length
        ? {
            evidenceSelections: evidenceSelections.map(selection => ({
              ...selection,
            })),
          }
        : {}),
    },
    configuration: {
      methodology: state.configuration.methodology,
      reportStyle: state.configuration.reportStyle,
      includeEvidence: state.configuration.includeEvidence,
    },
    brandingMode: state.branding.brandingMode,
  });
};
