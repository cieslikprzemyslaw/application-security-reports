import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  act,
  createTestDom,
  createTestingLibraryRoot,
  fireEvent,
  waitFor,
} from '~/test/vitestLegacyBridge';

import { useState } from 'react';
import { ThemeProvider } from 'styled-components';

import { defaultTheme } from '~/theme';

import ReportBuilderSelectionTree from './reportBuilderSelectionTree.component';

const assessmentTitle = 'Customer Services Portal';
const threatOneId = 'thr_00000000-0000-0000-0000-000000000001';
const threatTwoId = 'thr_00000000-0000-0000-0000-000000000002';
const evidenceOneId = 'evd_00000000-0000-0000-0000-000000000001';
const evidenceTwoId = 'evd_00000000-0000-0000-0000-000000000002';
const evidenceThreeId = 'evd_00000000-0000-0000-0000-000000000003';

const setupDom = () => {
  const dom = createTestDom(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/' },
  );

  const { window } = dom;

  Object.defineProperty(globalThis, 'window', {
    value: window,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: window.document,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: window.navigator,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'HTMLElement', {
    value: window.HTMLElement,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'Node', {
    value: window.Node,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'MouseEvent', {
    value: window.MouseEvent,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    value: true,
    configurable: true,
    writable: true,
  });

  return {
    container: window.document.getElementById('root'),
    window,
  };
};

describe('reportBuilderSelectionTree', () => {
  it('keeps exact selected IDs and partial parent state', async () => {
    const threats = [
      {
        id: threatOneId,
        title: 'Missing Server-Side Authorization',
        severity: 'critical' as const,
        evidence: [
          { id: evidenceOneId, title: 'Captured request', description: '' },
          { id: evidenceTwoId, title: 'Captured response', description: '' },
        ],
      },
      {
        id: threatTwoId,
        title: 'Verbose Error Messages',
        severity: 'medium' as const,
        evidence: [
          { id: evidenceThreeId, title: 'Stack trace', description: '' },
        ],
      },
    ];

    const Harness = () => {
      const [includeEvidence, setIncludeEvidence] = useState(false);
      const [selectedThreatIds, setSelectedThreatIds] = useState<string[]>([
        threatOneId,
      ]);
      const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([
        evidenceOneId,
      ]);

      return (
        <>
          <ReportBuilderSelectionTree
            assessmentTitle={assessmentTitle}
            includeEvidence={includeEvidence}
            selectedThreatIds={selectedThreatIds}
            selectedEvidenceIds={selectedEvidenceIds}
            threats={threats}
            onIncludeEvidenceChange={checked => setIncludeEvidence(checked)}
            onThreatToggle={(threatId, checked) =>
              setSelectedThreatIds(current =>
                checked
                  ? Array.from(new Set([...current, threatId]))
                  : current.filter(
                      existingThreatId => existingThreatId !== threatId,
                    ),
              )
            }
            onEvidenceToggle={(evidenceId, checked) =>
              setSelectedEvidenceIds(current =>
                checked
                  ? Array.from(new Set([...current, evidenceId]))
                  : current.filter(
                      existingEvidenceId => existingEvidenceId !== evidenceId,
                    ),
              )
            }
          />

          <pre data-testid="selection-state">
            {JSON.stringify({
              includeEvidence,
              selectedThreatIds,
              selectedEvidenceIds,
            })}
          </pre>
        </>
      );
    };

    const { container } = setupDom();

    assert.ok(container, 'Expected root container to exist');

    const reactRoot = createTestingLibraryRoot(container);

    await act(async () => {
      reactRoot.render(
        <ThemeProvider theme={defaultTheme}>
          <Harness />
        </ThemeProvider>,
      );
    });

    const includeEvidenceCheckbox = container.querySelector(
      '#report-builder-include-evidence',
    ) as HTMLInputElement | null;

    assert.ok(includeEvidenceCheckbox);
    assert.equal(
      container.querySelector(`#report-builder-evidence-${evidenceOneId}`),
      null,
    );

    await act(async () => {
      fireEvent.click(includeEvidenceCheckbox!);
    });

    await waitFor(() => {
      const state = JSON.parse(
        container.querySelector('[data-testid="selection-state"]')
          ?.textContent ?? '{}',
      ) as {
        includeEvidence: boolean;
        selectedThreatIds: string[];
        selectedEvidenceIds: string[];
      };

      assert.equal(state.includeEvidence, true);
      assert.deepEqual(state.selectedThreatIds, [threatOneId]);
      assert.deepEqual(state.selectedEvidenceIds, [evidenceOneId]);
    });

    const threatOneCheckbox = container.querySelector(
      `#report-builder-threat-${threatOneId}`,
    ) as HTMLInputElement | null;
    const threatTwoCheckbox = container.querySelector(
      `#report-builder-threat-${threatTwoId}`,
    ) as HTMLInputElement | null;
    const evidenceOneCheckbox = container.querySelector(
      `#report-builder-evidence-${evidenceOneId}`,
    ) as HTMLInputElement | null;
    const evidenceTwoCheckbox = container.querySelector(
      `#report-builder-evidence-${evidenceTwoId}`,
    ) as HTMLInputElement | null;

    assert.ok(threatOneCheckbox);
    assert.ok(threatTwoCheckbox);
    assert.ok(evidenceOneCheckbox);
    assert.ok(evidenceTwoCheckbox);
    assert.equal(threatOneCheckbox?.dataset.indeterminate, 'true');
    assert.equal(threatTwoCheckbox?.dataset.indeterminate, 'false');
    assert.equal(evidenceOneCheckbox?.checked, true);
    assert.equal(evidenceTwoCheckbox?.checked, false);

    await act(async () => {
      fireEvent.click(evidenceTwoCheckbox!);
    });

    await waitFor(() => {
      const state = JSON.parse(
        container.querySelector('[data-testid="selection-state"]')
          ?.textContent ?? '{}',
      ) as {
        includeEvidence: boolean;
        selectedThreatIds: string[];
        selectedEvidenceIds: string[];
      };

      assert.deepEqual(state.selectedEvidenceIds, [
        evidenceOneId,
        evidenceTwoId,
      ]);
    });

    await waitFor(() => {
      assert.equal(threatOneCheckbox?.dataset.indeterminate, 'false');
    });

    await act(async () => {
      fireEvent.click(evidenceOneCheckbox!);
    });

    await waitFor(() => {
      const state = JSON.parse(
        container.querySelector('[data-testid="selection-state"]')
          ?.textContent ?? '{}',
      ) as {
        includeEvidence: boolean;
        selectedThreatIds: string[];
        selectedEvidenceIds: string[];
      };

      assert.deepEqual(state.selectedEvidenceIds, [evidenceTwoId]);
      assert.equal(threatOneCheckbox?.dataset.indeterminate, 'true');
    });

    await act(async () => {
      fireEvent.click(threatTwoCheckbox!);
    });

    await waitFor(() => {
      const state = JSON.parse(
        container.querySelector('[data-testid="selection-state"]')
          ?.textContent ?? '{}',
      ) as {
        includeEvidence: boolean;
        selectedThreatIds: string[];
        selectedEvidenceIds: string[];
      };

      assert.deepEqual(state.selectedThreatIds, [threatOneId, threatTwoId]);
      assert.deepEqual(state.selectedEvidenceIds, [evidenceTwoId]);
    });

    await act(async () => {
      reactRoot.unmount();
    });
  });
});
