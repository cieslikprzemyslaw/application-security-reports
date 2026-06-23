import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { Threat } from '../../src/domain/threat.js';
import {
  ValidationError,
  type ValidationFieldError,
} from '../../src/validation/index.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';

export type ReportPreviewSelectionResource =
  | 'assessment'
  | 'threat'
  | 'evidence';

export class ReportPreviewSelectionNotFoundError extends RepositoryNotFoundError {
  public readonly resource: ReportPreviewSelectionResource;

  constructor(resource: ReportPreviewSelectionResource) {
    const label = resource[0].toUpperCase() + resource.slice(1);
    super(`${label} not found.`);
    this.resource = resource;
  }
}

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

const requireRecord = <T>(
  record: T | null,
  resource: ReportPreviewSelectionResource,
): T => {
  if (!record) {
    throw new ReportPreviewSelectionNotFoundError(resource);
  }

  return record;
};

const resolveSelectedRecords = async <T>(
  ids: readonly string[],
  findById: (id: string) => Promise<T | null>,
  resource: ReportPreviewSelectionResource,
): Promise<T[]> => {
  const records: T[] = [];

  for (const id of ids) {
    const record = await findById(id);

    records.push(requireRecord(record, resource));
  }

  return records;
};

export const resolveReportPreviewSelectedRecords = async (
  request: ReportPreviewRequest,
  repositories: ReportPreviewSelectionRepositories,
): Promise<ResolvedReportPreviewRecords> => {
  const assessment = requireRecord(
    await repositories.assessmentRepository.findById(request.assessmentId),
    'assessment',
  );

  const threats = await resolveSelectedRecords(
    request.selection.threatIds,
    id => repositories.threatRepository.findById(id),
    'threat',
  );

  const evidence = await resolveSelectedRecords(
    request.selection.evidenceIds,
    id => repositories.evidenceRepository.findById(id),
    'evidence',
  );

  return {
    assessment,
    threats,
    evidence,
  };
};

const addValidationError = (
  fields: ValidationFieldError[],
  path: string,
  message: string,
) => {
  fields.push({ path, message, code: 'custom' });
};

export const validateReportPreviewSelectedRecords = (
  request: ReportPreviewRequest,
  records: ResolvedReportPreviewRecords,
): ResolvedReportPreviewRecords => {
  const fields: ValidationFieldError[] = [];

  if (records.assessment.id !== request.assessmentId) {
    addValidationError(
      fields,
      'assessmentId',
      'Resolved Assessment does not match the requested Assessment.',
    );
  }

  if (records.assessment.companyId !== request.companyId) {
    addValidationError(
      fields,
      'companyId',
      'Assessment does not belong to the requested Company.',
    );
  }

  if (records.assessment.status === 'archived') {
    addValidationError(
      fields,
      'assessmentId',
      'Archived Assessments are not selectable.',
    );
  }

  records.threats.forEach((threat, index) => {
    if (threat.assessmentId !== records.assessment.id) {
      addValidationError(
        fields,
        `selection.threatIds.${index}`,
        'Threat does not belong to the selected Assessment.',
      );
    }
  });

  records.evidence.forEach((evidence, index) => {
    if (evidence.assessmentId !== records.assessment.id) {
      addValidationError(
        fields,
        `selection.evidenceIds.${index}`,
        'Evidence does not belong to the selected Assessment.',
      );
    }
  });

  if (fields.length > 0) {
    throw new ValidationError({
      error: 'VALIDATION_ERROR',
      fields,
    });
  }

  return records;
};
