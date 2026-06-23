import assert from 'node:assert/strict';

import React, { useState } from 'react';
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
        findingsCount: 1,
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
        selectedAssessmentId={undefined}
        selectedThreatIds={[]}
        selectedEvidenceIds={[]}
        onAssessmentSelect={() => undefined}
        onThreatToggle={() => undefined}
        onEvidenceToggle={() => undefined}
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
        selectedAssessmentId={undefined}
        selectedThreatIds={[]}
        selectedEvidenceIds={[]}
        onAssessmentSelect={() => undefined}
        onThreatToggle={() => undefined}
        onEvidenceToggle={() => undefined}
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
        selectedAssessmentId={undefined}
        selectedThreatIds={[]}
        selectedEvidenceIds={[]}
        onAssessmentSelect={() => undefined}
        onThreatToggle={() => undefined}
        onEvidenceToggle={() => undefined}
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

  it('keeps selection controlled by builder state', async () => {
    const user = renderWithProviders(
      <Harness hierarchy={populatedHierarchy} />,
    ).user;

    await waitFor(() => {
      assert.ok(
        screen.getByRole('button', {
          name: /Customer Services Portal.*Assessment/i,
        }),
      );
    });

    const assessmentButton = screen.getByRole('button', {
      name: /Customer Services Portal.*Assessment/i,
    });
    const threatButton = screen.getByRole('button', {
      name: /Missing Server-Side Authorization.*evidence/i,
    });
    const evidenceButton = screen.getByRole('button', {
      name: /Authorization note.*Evidence/i,
    });

    assert.equal(assessmentButton.getAttribute('aria-pressed'), 'false');
    assert.equal(threatButton.getAttribute('aria-pressed'), 'false');
    assert.equal(evidenceButton.getAttribute('aria-pressed'), 'false');

    await user.click(assessmentButton);
    await user.click(threatButton);
    await user.click(evidenceButton);

    await waitFor(() => {
      assert.equal(assessmentButton.getAttribute('aria-pressed'), 'true');
      assert.equal(threatButton.getAttribute('aria-pressed'), 'true');
      assert.equal(evidenceButton.getAttribute('aria-pressed'), 'true');
    });
  });
});

const Harness = ({ hierarchy }: { hierarchy: ReportBuilderHierarchy }) => {
  const [selection, setSelection] = useState({
    selectedAssessmentId: undefined as string | undefined,
    selectedThreatIds: [] as string[],
    selectedEvidenceIds: [] as string[],
  });

  return (
    <ReportBuilderTree
      companyId={hierarchy.companyId}
      companyName="Northstar Digital"
      selectedAssessmentId={selection.selectedAssessmentId}
      selectedThreatIds={selection.selectedThreatIds}
      selectedEvidenceIds={selection.selectedEvidenceIds}
      onAssessmentSelect={assessmentId =>
        setSelection(current => ({
          ...current,
          selectedAssessmentId: assessmentId,
        }))
      }
      onThreatToggle={(threatId, selected) =>
        setSelection(current => ({
          ...current,
          selectedThreatIds: selected
            ? Array.from(new Set([...current.selectedThreatIds, threatId]))
            : current.selectedThreatIds.filter(item => item !== threatId),
        }))
      }
      onEvidenceToggle={(evidenceId, selected) =>
        setSelection(current => ({
          ...current,
          selectedEvidenceIds: selected
            ? Array.from(new Set([...current.selectedEvidenceIds, evidenceId]))
            : current.selectedEvidenceIds.filter(item => item !== evidenceId),
        }))
      }
      loadHierarchy={async () => hierarchy}
    />
  );
};
