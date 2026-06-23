import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { Threat } from '../../src/domain/threat.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';

export interface ResolvedReportPreviewRecords {
  assessment: Assessment;
  threats: Threat[];
  evidence: Evidence[];
}

export interface ReportPreviewSelectionRepositories {
  assessmentRepository: Pick<AssessmentRepository, 'findById'>;
  threatRepository: Pick<ThreatRepository, 'findById'>;
  evidenceRepository: Pick<EvidenceRepository, 'findById'>;
}

const requireRecord = <T>(record: T | null, resourceName: string): T => {
  if (!record) {
    throw new RepositoryNotFoundError(`${resourceName} not found.`);
  }

  return record;
};

const resolveSelectedRecords = async <T>(
  ids: readonly string[],
  findById: (id: string) => Promise<T | null>,
  resourceName: string,
): Promise<T[]> => {
  const records: T[] = [];

  for (const id of ids) {
    const record = await findById(id);

    records.push(requireRecord(record, resourceName));
  }

  return records;
};

export const resolveReportPreviewSelectedRecords = async (
  request: ReportPreviewRequest,
  repositories: ReportPreviewSelectionRepositories,
): Promise<ResolvedReportPreviewRecords> => {
  const assessment = requireRecord(
    await repositories.assessmentRepository.findById(request.assessmentId),
    'Assessment',
  );

  const threats = await resolveSelectedRecords(
    request.selection.threatIds,
    id => repositories.threatRepository.findById(id),
    'Threat',
  );

  const evidence = await resolveSelectedRecords(
    request.selection.evidenceIds,
    id => repositories.evidenceRepository.findById(id),
    'Evidence',
  );

  return {
    assessment,
    threats,
    evidence,
  };
};
