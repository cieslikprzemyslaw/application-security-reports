import type {
  CreateDraftReportVersionRequest,
  ReportVersion,
} from '../../src/domain/report.js';
import { ValidationError } from '../../src/validation/index.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import {
  generateReportPreviewSnapshot,
  type ReportPreviewGenerationRepositories,
} from './report-preview-generation.service.js';
import { withNextReportVersionNumber } from './report-version-numbering.service.js';

export interface CreateDraftReportVersionInput {
  reportId: string;
  request: CreateDraftReportVersionRequest;
  baseUrl: string;
}

export interface CreateDraftReportVersionDependencies extends ReportPreviewGenerationRepositories {
  reportRepository: Pick<ReportRepository, 'findById'>;
  reportVersionRepository: ReportVersionRepository;
  now?: () => Date;
}

export class DraftReportNotFoundError extends RepositoryNotFoundError {
  constructor() {
    super('Report not found.');
    this.name = 'DraftReportNotFoundError';
  }
}

const requireReportAssessment = (
  reportAssessmentId: string,
  requestAssessmentId: string,
): void => {
  if (reportAssessmentId === requestAssessmentId) {
    return;
  }

  throw new ValidationError({
    error: 'VALIDATION_ERROR',
    fields: [
      {
        path: 'assessmentId',
        message: 'Assessment does not belong to the requested Report.',
        code: 'custom',
      },
    ],
  });
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const createDraftReportVersion = async (
  input: CreateDraftReportVersionInput,
  dependencies: CreateDraftReportVersionDependencies,
): Promise<ReportVersion> => {
  const report = await dependencies.reportRepository.findById(input.reportId);

  if (!report) {
    throw new DraftReportNotFoundError();
  }

  requireReportAssessment(report.assessmentId, input.request.assessmentId);

  const previewSnapshot = await generateReportPreviewSnapshot(
    input.request,
    dependencies,
    input.baseUrl,
  );
  const snapshot = {
    ...previewSnapshot,
    reportTitle: report.title,
  };
  const generatedAt = toIsoDate((dependencies.now ?? (() => new Date()))());

  return withNextReportVersionNumber(
    input.reportId,
    'draft',
    dependencies.reportVersionRepository,
    async ({ version, repository }) => {
      const created = await repository.create({
        reportId: input.reportId,
        version,
        status: 'draft',
        generatedAt,
        snapshot,
      });

      await repository.updateReportLatestVersion(input.reportId, version);
      await repository.applyRetention(input.reportId, version);

      return created;
    },
  );
};
