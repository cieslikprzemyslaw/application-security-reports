import { SEVERITIES, type Severity } from '../../src/domain/common.js';
import type { ReportPreviewRiskSummary } from '../../src/domain/report-preview.js';
import type { ResolvedReportPreviewRecords } from './report-preview-selection.service.js';

const severityRank = new Map<Severity, number>(
  SEVERITIES.map((severity, index) => [severity, index]),
);

const getHigherSeverity = (
  current: Severity | undefined,
  candidate: Severity,
): Severity => {
  if (!current) {
    return candidate;
  }

  return (severityRank.get(candidate) ?? -1) > (severityRank.get(current) ?? -1)
    ? candidate
    : current;
};

export const computeReportPreviewRiskSummary = (
  records: Pick<ResolvedReportPreviewRecords, 'threats' | 'evidence'>,
): ReportPreviewRiskSummary => {
  const overallRisk = records.threats.reduce<Severity | undefined>(
    (current, threat) => getHigherSeverity(current, threat.severity),
    undefined,
  );

  return {
    ...(overallRisk ? { overallRisk } : {}),
    threatCount: records.threats.length,
    evidenceCount: records.evidence.length,
  };
};
