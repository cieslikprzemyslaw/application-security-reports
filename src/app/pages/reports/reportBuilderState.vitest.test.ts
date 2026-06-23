import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  createDefaultReportBuilderState,
  restoreReportBuilderRouteState,
  serializeReportBuilderRouteState,
  updateReportBuilderConfiguration,
  updateReportBuilderSelection,
} from './reportBuilderState.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

describe('Report builder state helpers', () => {
  it('round-trips empty, partial, and complete route state safely', () => {
    const emptyState = createDefaultReportBuilderState();

    assert.deepEqual(serializeReportBuilderRouteState(emptyState), {});
    assert.deepEqual(restoreReportBuilderRouteState({}), emptyState);

    const partialState = restoreReportBuilderRouteState({
      selection: {
        selectedThreatIds: [threatId],
      },
      configuration: {
        includeEvidence: true,
      },
    });

    assert.deepEqual(partialState.selection.selectedThreatIds, [threatId]);
    assert.equal(partialState.selection.selectedEvidenceIds.length, 0);
    assert.equal(partialState.configuration.includeEvidence, true);

    assert.deepEqual(serializeReportBuilderRouteState(partialState), {
      selection: {
        selectedThreatIds: [threatId],
      },
      configuration: {
        includeEvidence: true,
      },
    });

    const completeState = restoreReportBuilderRouteState({
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
        companyName: 'Northstar Digital',
        companyWebsite: 'https://northstar.example',
        companyContactEmail: 'security@northstar.example',
        companyLogoUrl: null,
        companyFooterText: 'Confidential - do not distribute.',
        issuerName: 'Northstar Digital',
        issuerContactName: 'Alex Mercer',
        issuerContactEmail: 'alex.mercer@example.com',
        issuerLogoUrl: null,
        reportFooterText: 'Confidential',
        reportConfidentialityLabel: 'Strictly confidential',
        confidentialReports: true,
        allowedBrandingModes: ['issuer', 'client'],
        defaultBrandingMode: 'client',
      },
    });

    assert.deepEqual(serializeReportBuilderRouteState(completeState), {
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
        companyName: 'Northstar Digital',
        companyWebsite: 'https://northstar.example',
        companyContactEmail: 'security@northstar.example',
        companyLogoUrl: null,
        companyFooterText: 'Confidential - do not distribute.',
        issuerName: 'Northstar Digital',
        issuerContactName: 'Alex Mercer',
        issuerContactEmail: 'alex.mercer@example.com',
        issuerLogoUrl: null,
        reportFooterText: 'Confidential',
        reportConfidentialityLabel: 'Strictly confidential',
        confidentialReports: true,
        allowedBrandingModes: ['issuer', 'client'],
        defaultBrandingMode: 'client',
      },
    });

    assert.deepEqual(
      restoreReportBuilderRouteState(
        serializeReportBuilderRouteState(completeState),
      ),
      completeState,
    );
  });

  it('fails safely for malformed restored route state', () => {
    const defaultState = createDefaultReportBuilderState();

    assert.deepEqual(
      restoreReportBuilderRouteState({
        selection: {
          selectedThreatIds: [threatId, threatId],
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState({
        selection: {
          selectedAssessmentId: 'cmp_00000000-0000-0000-0000-000000000001',
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState({
        branding: {
          companyWebsite: 'not-a-url',
        },
      }),
      defaultState,
    );

    assert.deepEqual(
      restoreReportBuilderRouteState({
        unexpected: true,
      }),
      defaultState,
    );
  });

  it('preserves explicit exclusions and unrelated state when updating', () => {
    const initialState = restoreReportBuilderRouteState({
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

    assert.equal(nextSelection.selection.selectedAssessmentId, assessmentId);
    assert.deepEqual(nextSelection.selection.selectedThreatIds, [threatId]);
    assert.deepEqual(nextSelection.selection.selectedEvidenceIds, []);
    assert.equal(nextSelection.configuration.includeEvidence, false);
    assert.equal(nextSelection.branding.brandingMode, 'issuer');
  });
});
