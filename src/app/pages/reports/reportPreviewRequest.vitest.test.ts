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

  it('does not create a request before an assessment is selected', () => {
    expect(
      createReportPreviewRequest(
        createDefaultReportBuilderState(previewCompanyId),
      ),
    ).toBeNull();
  });
});
