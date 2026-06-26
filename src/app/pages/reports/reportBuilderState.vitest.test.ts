import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  createDefaultReportBuilderState,
  restoreReportBuilderRouteState,
  serializeReportBuilderRouteState,
  updateReportBuilderConfiguration,
  updateReportBuilderReportId,
  updateReportBuilderSelection,
} from './reportBuilderState.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const otherCompanyId = 'cmp_00000000-0000-0000-0000-000000000002';
const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

describe('Report builder state helpers', () => {
  it('creates and round-trips company-owned route state safely', () => {
    const emptyState = createDefaultReportBuilderState(companyId);

    assert.deepEqual(serializeReportBuilderRouteState(emptyState), {
      companyId,
    });
    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, { companyId }),
      emptyState,
    );

    const partialState = restoreReportBuilderRouteState(companyId, {
      companyId,
      selection: {
        selectedThreatIds: [threatId],
      },
      configuration: {
        includeEvidence: true,
      },
    });

    assert.equal(partialState.companyId, companyId);
    assert.deepEqual(partialState.selection.selectedThreatIds, [threatId]);
    assert.equal(partialState.selection.selectedEvidenceIds.length, 0);
    assert.equal(partialState.configuration.includeEvidence, true);

    assert.deepEqual(serializeReportBuilderRouteState(partialState), {
      companyId,
      selection: {
        selectedThreatIds: [threatId],
      },
      configuration: {
        includeEvidence: true,
      },
    });

    const completeState = restoreReportBuilderRouteState(companyId, {
      companyId,
      reportId,
      selection: {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        methodology: 'OWASP ASVS / WSTG',
        reportStyle: 'Technical & structured',
        includeEvidence: true,
      },
      branding: {
        brandingMode: 'client',
      },
    });

    assert.deepEqual(serializeReportBuilderRouteState(completeState), {
      companyId,
      reportId,
      selection: {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        methodology: 'OWASP ASVS / WSTG',
        reportStyle: 'Technical & structured',
        includeEvidence: true,
      },
      branding: {
        brandingMode: 'client',
      },
    });

    assert.deepEqual(
      restoreReportBuilderRouteState(
        companyId,
        serializeReportBuilderRouteState(completeState),
      ),
      completeState,
    );
  });

  it('fails safely for malformed or cross-company restored route state', () => {
    const defaultState = createDefaultReportBuilderState(companyId);

    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        companyId,
        selection: {
          selectedThreatIds: [threatId, threatId],
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        companyId,
        selection: {
          selectedAssessmentId: 'cmp_00000000-0000-0000-0000-000000000001',
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        companyId: otherCompanyId,
        branding: {
          brandingMode: 'client',
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        companyId,
        branding: {
          companyWebsite: 'https://northstar.example',
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        companyId,
        reportId,
      }),
      defaultState,
    );

    assert.throws(() => updateReportBuilderReportId(defaultState, reportId));
    assert.deepEqual(
      restoreReportBuilderRouteState(companyId, {
        unexpected: true,
      }),
      defaultState,
    );
  });

  it('preserves explicit exclusions and unrelated state when updating', () => {
    const initialState = restoreReportBuilderRouteState(companyId, {
      companyId,
      selection: {
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        includeEvidence: false,
      },
    });

    const nextConfiguration = updateReportBuilderConfiguration(initialState, {
      methodology: '  OWASP ASVS / WSTG  ',
      includeEvidence: true,
    });

    assert.equal(nextConfiguration.companyId, companyId);
    assert.deepEqual(nextConfiguration.selection.selectedThreatIds, [threatId]);
    assert.deepEqual(nextConfiguration.selection.selectedEvidenceIds, [
      evidenceId,
    ]);
    assert.equal(
      nextConfiguration.configuration.methodology,
      'OWASP ASVS / WSTG',
    );
    assert.equal(nextConfiguration.configuration.includeEvidence, true);
    assert.equal(nextConfiguration.branding.brandingMode, 'issuer');

    const nextSelection = updateReportBuilderSelection(initialState, {
      selectedAssessmentId: ` ${assessmentId} `,
      selectedThreatIds: [threatId, threatId],
      selectedEvidenceIds: [],
    });

    assert.equal(nextSelection.companyId, companyId);
    assert.equal(nextSelection.selection.selectedAssessmentId, assessmentId);
    assert.deepEqual(nextSelection.selection.selectedThreatIds, [threatId]);
    assert.deepEqual(nextSelection.selection.selectedEvidenceIds, []);
    assert.equal(nextSelection.configuration.includeEvidence, false);
    assert.equal(nextSelection.branding.brandingMode, 'issuer');
  });
  it('retains a returned Report ID without losing builder state', () => {
    const initialState = restoreReportBuilderRouteState(companyId, {
      companyId,
      selection: {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        methodology: 'OWASP ASVS / WSTG',
        includeEvidence: true,
      },
      branding: {
        brandingMode: 'client',
      },
    });

    const nextState = updateReportBuilderReportId(initialState, reportId);

    assert.equal(nextState.reportId, reportId);
    assert.deepEqual(nextState.selection, initialState.selection);
    assert.deepEqual(nextState.configuration, initialState.configuration);
    assert.deepEqual(nextState.branding, initialState.branding);

    assert.deepEqual(serializeReportBuilderRouteState(nextState), {
      companyId,
      reportId,
      selection: {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        methodology: 'OWASP ASVS / WSTG',
        includeEvidence: true,
      },
      branding: {
        brandingMode: 'client',
      },
    });
  });

  it('clears the selected assessment without changing descendant selections', () => {
    const initialState = restoreReportBuilderRouteState(companyId, {
      companyId,
      selection: {
        selectedAssessmentId: assessmentId,
        selectedThreatIds: [threatId],
        selectedEvidenceIds: [evidenceId],
      },
      configuration: {
        includeEvidence: true,
      },
    });

    const nextState = updateReportBuilderSelection(initialState, {
      selectedAssessmentId: null,
    });

    assert.equal(nextState.selection.selectedAssessmentId, undefined);
    assert.deepEqual(nextState.selection.selectedThreatIds, [threatId]);
    assert.deepEqual(nextState.selection.selectedEvidenceIds, [evidenceId]);
    assert.equal(nextState.configuration.includeEvidence, true);
  });
});
