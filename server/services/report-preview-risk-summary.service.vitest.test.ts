import { describe, expect, it } from 'vitest';

import { SEVERITIES, type Severity } from '../../src/domain/common.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { Threat } from '../../src/domain/threat.js';
import { computeReportPreviewRiskSummary } from './report-preview-risk-summary.service.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const timestamp = '2026-06-23T12:00:00.000Z';

const buildThreat = (severity: Severity, index = 1): Threat => ({
  id: `thr_00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
  assessmentId,
  title: `${severity} threat`,
  description: `${severity} severity threat`,
  severity,
  strideCategories: ['tampering'],
  status: 'open',
  createdAt: timestamp,
  updatedAt: timestamp,
});

const buildEvidence = (index = 1): Evidence => ({
  id: `evd_00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
  assessmentId,
  threatIds: [],
  type: 'note',
  title: `Evidence ${index}`,
  createdAt: timestamp,
  updatedAt: timestamp,
});

describe('computeReportPreviewRiskSummary', () => {
  it.each(SEVERITIES)(
    'uses %s as overall risk when it is the only selected severity',
    severity => {
      expect(
        computeReportPreviewRiskSummary({
          threats: [buildThreat(severity)],
          evidence: [],
        }),
      ).toEqual({
        overallRisk: severity,
        threatCount: 1,
        evidenceCount: 0,
      });
    },
  );

  it('uses the highest selected severity and counts selected records', () => {
    expect(
      computeReportPreviewRiskSummary({
        threats: [
          buildThreat('low', 1),
          buildThreat('critical', 2),
          buildThreat('medium', 3),
          buildThreat('high', 4),
          buildThreat('informational', 5),
        ],
        evidence: [buildEvidence(1), buildEvidence(2)],
      }),
    ).toEqual({
      overallRisk: 'critical',
      threatCount: 5,
      evidenceCount: 2,
    });
  });

  it('returns the approved zero summary for an empty selection', () => {
    expect(
      computeReportPreviewRiskSummary({
        threats: [],
        evidence: [],
      }),
    ).toEqual({
      threatCount: 0,
      evidenceCount: 0,
    });
  });

  it('is unaffected by Threats outside the selected records', () => {
    const selectedThreats = [buildThreat('medium')];
    const unselectedThreat = buildThreat('critical', 2);

    const summary = computeReportPreviewRiskSummary({
      threats: selectedThreats,
      evidence: [buildEvidence()],
    });

    expect(unselectedThreat.severity).toBe('critical');

    expect(summary).toEqual({
      overallRisk: 'medium',
      threatCount: 1,
      evidenceCount: 1,
    });
  });

  it('returns deterministic output without mutating selected records', () => {
    const threats = [buildThreat('high'), buildThreat('low', 2)];

    const evidence = [buildEvidence()];

    const originalThreats = structuredClone(threats);
    const originalEvidence = structuredClone(evidence);

    const first = computeReportPreviewRiskSummary({
      threats,
      evidence,
    });

    const second = computeReportPreviewRiskSummary({
      threats,
      evidence,
    });

    expect(second).toEqual(first);
    expect(threats).toEqual(originalThreats);
    expect(evidence).toEqual(originalEvidence);
  });
});
