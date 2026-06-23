import assert from 'node:assert/strict';

import React from 'react';
import { describe, it } from 'vitest';

import { renderWithProviders, screen, waitFor } from '~/test/render';

import ReportBuilderTree from './reportBuilderTree.component';
import type { ReportBuilderHierarchy } from './reportBuilderTree.service';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';

const populatedHierarchy: ReportBuilderHierarchy = {
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

describe('ReportBuilderTree', () => {
  it('shows distinct loading, empty, and error states', async () => {
    const loadingPromise = new Promise<ReportBuilderHierarchy>(() => undefined);

    renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        loadHierarchy={() => loadingPromise}
      />,
    );

    assert.ok(
      screen
        .getByRole('status')
        .textContent?.includes('Loading company hierarchy'),
    );
  });

  it('renders the empty and error states', async () => {
    const { rerender } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        loadHierarchy={async () => ({
          companyId,
          assessments: [],
        })}
      />,
    );

    await waitFor(() => {
      assert.ok(screen.getByText('No assessments yet'));
    });

    rerender(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        loadHierarchy={async () => {
          throw new Error('Unable to reach API');
        }}
      />,
    );

    await waitFor(() => {
      assert.ok(
        screen.getByRole('alert').textContent?.includes('Unable to reach API'),
      );
    });
  });

  it('propagates parent selection, preserves child exclusions, and supports keyboard toggles', async () => {
    const { user, container } = renderWithProviders(
      <ReportBuilderTree
        companyId={companyId}
        companyName="Northstar Digital"
        loadHierarchy={async () => populatedHierarchy}
      />,
    );

    await waitFor(() => {
      assert.ok(
        screen.getByRole('checkbox', {
          name: /Customer Services Portal/,
        }),
      );
    });

    const assessmentCheckbox = screen.getByRole('checkbox', {
      name: /Customer Services Portal/,
    });
    const threatOneCheckbox = screen.getByRole('checkbox', {
      name: /Missing Server-Side Authorization/,
    });
    const threatTwoCheckbox = screen.getByRole('checkbox', {
      name: /Verbose Error Messages/,
    });
    const evidenceOneCheckbox = screen.getByRole('checkbox', {
      name: /Authorization note/,
    });
    const evidenceTwoCheckbox = screen.getByRole('checkbox', {
      name: /HTTP exchange evidence/,
    });

    assert.equal((assessmentCheckbox as HTMLInputElement).checked, false);
    assert.equal((assessmentCheckbox as HTMLInputElement).indeterminate, false);
    assert.equal((threatOneCheckbox as HTMLInputElement).checked, false);
    assert.equal((threatTwoCheckbox as HTMLInputElement).checked, false);
    assert.equal((evidenceOneCheckbox as HTMLInputElement).checked, false);
    assert.equal((evidenceTwoCheckbox as HTMLInputElement).checked, false);

    await user.click(assessmentCheckbox);

    await waitFor(() => {
      assert.equal((assessmentCheckbox as HTMLInputElement).checked, true);
      assert.equal(
        (assessmentCheckbox as HTMLInputElement).indeterminate,
        false,
      );
      assert.equal((threatOneCheckbox as HTMLInputElement).checked, true);
      assert.equal((threatTwoCheckbox as HTMLInputElement).checked, true);
      assert.equal((evidenceOneCheckbox as HTMLInputElement).checked, true);
      assert.equal((evidenceTwoCheckbox as HTMLInputElement).checked, true);
    });

    let summary = JSON.parse(
      container.querySelector('.report-builder-tree-summary-json')
        ?.textContent ?? '{}',
    ) as {
      selectedAssessmentId?: string;
      selectedThreatIds: string[];
      selectedEvidenceIds: string[];
    };

    assert.deepEqual(summary, {
      selectedAssessmentId: 'asm_00000000-0000-0000-0000-000000000001',
      selectedThreatIds: [
        'thr_00000000-0000-0000-0000-000000000001',
        'thr_00000000-0000-0000-0000-000000000002',
      ],
      selectedEvidenceIds: [
        'evd_00000000-0000-0000-0000-000000000001',
        'evd_00000000-0000-0000-0000-000000000002',
      ],
    });

    await user.click(evidenceOneCheckbox);

    await waitFor(() => {
      assert.equal((assessmentCheckbox as HTMLInputElement).checked, false);
      assert.equal(
        (assessmentCheckbox as HTMLInputElement).indeterminate,
        true,
      );
      assert.equal((threatOneCheckbox as HTMLInputElement).checked, false);
      assert.equal((threatOneCheckbox as HTMLInputElement).indeterminate, true);
      assert.equal((threatTwoCheckbox as HTMLInputElement).checked, true);
      assert.equal(
        (threatTwoCheckbox as HTMLInputElement).indeterminate,
        false,
      );
      assert.equal((evidenceOneCheckbox as HTMLInputElement).checked, false);
      assert.equal((evidenceTwoCheckbox as HTMLInputElement).checked, true);
    });

    (threatTwoCheckbox as HTMLInputElement).focus();
    await user.keyboard('[Space]');

    await waitFor(() => {
      assert.equal(
        (assessmentCheckbox as HTMLInputElement).indeterminate,
        true,
      );
      assert.equal((threatTwoCheckbox as HTMLInputElement).checked, false);
      assert.equal(
        (threatTwoCheckbox as HTMLInputElement).indeterminate,
        false,
      );
      assert.equal((evidenceTwoCheckbox as HTMLInputElement).checked, false);
    });

    summary = JSON.parse(
      container.querySelector('.report-builder-tree-summary-json')
        ?.textContent ?? '{}',
    ) as {
      selectedAssessmentId?: string;
      selectedThreatIds: string[];
      selectedEvidenceIds: string[];
    };

    assert.deepEqual(summary, {
      selectedAssessmentId: 'asm_00000000-0000-0000-0000-000000000001',
      selectedThreatIds: ['thr_00000000-0000-0000-0000-000000000001'],
      selectedEvidenceIds: [],
    });
  });
});
