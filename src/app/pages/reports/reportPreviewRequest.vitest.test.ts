import { describe, expect, it } from 'vitest';

import { createDefaultReportBuilderState } from './reportBuilderState';
import {
  previewApiRequest,
  previewBuilderState,
  previewCompanyId,
} from './reportPreview.testFixtures';
import { createReportPreviewRequest } from './reportPreviewRequest';

describe('createReportPreviewRequest', () => {
  it('maps the exact selected IDs configuration and branding mode', () => {
    expect(createReportPreviewRequest(previewBuilderState)).toEqual(
      previewApiRequest,
    );
  });

  it('preserves Threat-specific Evidence selections', () => {
    const request = createReportPreviewRequest({
      ...previewBuilderState,
      selection: {
        ...previewBuilderState.selection,
        selectedEvidenceSelections: [
          {
            threatId: previewBuilderState.selection.selectedThreatIds[0]!,
            evidenceId: previewBuilderState.selection.selectedEvidenceIds[0]!,
          },
        ],
      },
    });

    expect(request?.selection.evidenceSelections).toEqual([
      {
        threatId: previewBuilderState.selection.selectedThreatIds[0],
        evidenceId: previewBuilderState.selection.selectedEvidenceIds[0],
      },
    ]);
  });

  it('does not create a request before an assessment is selected', () => {
    expect(
      createReportPreviewRequest(
        createDefaultReportBuilderState(previewCompanyId),
      ),
    ).toBeNull();
  });
});
