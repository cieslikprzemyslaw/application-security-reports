import type { Assessment } from '../../src/domain/assessment.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import type {
  AssessmentWorkspaceCommand,
  AssessmentWorkspaceOverview,
} from './companies.route.types.js';

export const getAvailableAssessmentActions = (
  status: Assessment['status'],
): AssessmentWorkspaceCommand[] =>
  status === 'in-progress'
    ? ['complete', 'archive']
    : status === 'completed'
      ? ['reopen', 'archive']
      : status === 'archived'
        ? ['restore']
        : ['archive'];

export const buildAssessmentWorkspaceOverview = async (
  company: { id: string; name: string },
  assessment: Assessment,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  reportRepository: ReportRepository,
): Promise<AssessmentWorkspaceOverview> => {
  const [threats, evidence, reports] = await Promise.all([
    threatRepository.findByAssessmentId(assessment.id),
    evidenceRepository.findByAssessmentId(assessment.id),
    reportRepository.findByAssessmentId(assessment.id),
  ]);

  return {
    company: {
      id: company.id,
      name: company.name,
    },
    assessment: {
      ...assessment,
      findingsCount: threats.length,
      evidenceCount: evidence.length,
      reportVersionCount: reports.reduce(
        (count, report) => count + report.versions.length,
        0,
      ),
      availableActions: getAvailableAssessmentActions(assessment.status),
    },
  };
};
