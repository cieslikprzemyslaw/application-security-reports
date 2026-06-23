import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import type { ReportBuilderHierarchy } from './reportBuilderTree.service';
import {
  createReportBuilderSelectionTreeState,
  getReportBuilderExactSelection,
  toggleReportBuilderAssessmentSelection,
  toggleReportBuilderEvidenceSelection,
  toggleReportBuilderThreatSelection,
} from './reportBuilderSelectionTree';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';

const hierarchy: ReportBuilderHierarchy = {
  companyId,
  assessments: [
    {
      assessment: {
        id: 'asm_00000000-0000-0000-0000-000000000001',
        companyId,
        name: 'Customer Services Portal',
        applicationName: 'Customer Services Portal',
        type: 'Web App',
        status: 'in-progress',
        findingsCount: 2,
        updatedAt: '2026-06-10T00:00:00.000Z',
        description: 'Assessment of the customer portal',
        scope: 'Web application',
      },
      threats: [
        {
          threat: {
            id: 'thr_00000000-0000-0000-0000-000000000001',
            assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
            title: 'Missing Server-Side Authorization',
            description:
              'Authorization is missing on the order lookup endpoint.',
            severity: 'critical',
            strideCategories: ['elevation-of-privilege'],
            status: 'open',
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: 'evd_00000000-0000-0000-0000-000000000001',
                assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
                threatIds: ['thr_00000000-0000-0000-0000-000000000001'],
                type: 'text',
                title: 'Authorization note',
                createdAt: '2026-06-05T00:00:00.000Z',
                updatedAt: '2026-06-05T00:00:00.000Z',
              },
            },
          ],
        },
        {
          threat: {
            id: 'thr_00000000-0000-0000-0000-000000000002',
            assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
            title: 'Verbose Error Messages',
            description: 'Unhandled errors disclose stack traces.',
            severity: 'medium',
            strideCategories: ['information-disclosure'],
            status: 'mitigated',
            createdAt: '2026-06-04T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
          },
          evidence: [
            {
              evidence: {
                id: 'evd_00000000-0000-0000-0000-000000000002',
                assessmentId: 'asm_00000000-0000-0000-0000-000000000001',
                threatIds: ['thr_00000000-0000-0000-0000-000000000002'],
                type: 'http',
                title: 'HTTP exchange evidence',
                createdAt: '2026-06-06T00:00:00.000Z',
                updatedAt: '2026-06-06T00:00:00.000Z',
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('reportBuilderSelectionTree helpers', () => {
  it('propagates parent selection and preserves explicit exclusions across parent changes', () => {
    const selectedAssessmentId = 'asm_00000000-0000-0000-0000-000000000001';
    const threatOneId = 'thr_00000000-0000-0000-0000-000000000001';
    const threatTwoId = 'thr_00000000-0000-0000-0000-000000000002';
    const evidenceOneId = 'evd_00000000-0000-0000-0000-000000000001';
    const evidenceTwoId = 'evd_00000000-0000-0000-0000-000000000002';

    let state = createReportBuilderSelectionTreeState();

    state = toggleReportBuilderAssessmentSelection(
      state,
      selectedAssessmentId,
      true,
    );
    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedAssessmentId,
      selectedThreatIds: [threatOneId, threatTwoId],
      selectedEvidenceIds: [evidenceOneId, evidenceTwoId],
    });

    state = toggleReportBuilderEvidenceSelection(state, evidenceOneId, false);
    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedAssessmentId,
      selectedThreatIds: [threatOneId, threatTwoId],
      selectedEvidenceIds: [evidenceTwoId],
    });

    state = toggleReportBuilderThreatSelection(state, threatTwoId, false);
    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedAssessmentId,
      selectedThreatIds: [threatOneId],
      selectedEvidenceIds: [],
    });

    state = toggleReportBuilderAssessmentSelection(
      state,
      selectedAssessmentId,
      false,
    );
    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedThreatIds: [],
      selectedEvidenceIds: [],
    });

    state = toggleReportBuilderAssessmentSelection(
      state,
      selectedAssessmentId,
      true,
    );
    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedAssessmentId,
      selectedThreatIds: [threatOneId],
      selectedEvidenceIds: [],
    });
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

    assert.deepEqual(getReportBuilderExactSelection(state, hierarchy), {
      selectedThreatIds: [],
      selectedEvidenceIds: [],
    });
  });
});
