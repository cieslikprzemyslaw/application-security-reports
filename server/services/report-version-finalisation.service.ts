import type { ReportReadinessResult } from '../../src/domain/report-readiness.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { ReportVersionResponse } from '../../src/domain/report.js';
import { RepositoryConflictError } from '../database/errors.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import { resolveReportReadinessSnapshot } from './report-readiness.service.js';
import { getNextReportVersionNumber } from './report-version-numbering.service.js';

export interface FinaliseReportVersionInput {
  reportId: string;
  expectedLatestVersion: number;
  request: ReportPreviewRequest;
  baseUrl: string;
}

export interface FinaliseReportVersionDependencies {
  reportVersionRepository: Pick<
    ReportVersionRepository,
    'withFinalisationTransaction'
  >;
  now?: () => Date;
}

export interface FinalisedReportVersionResult {
  status: 'created';
  reportVersion: ReportVersionResponse;
}

export interface BlockedReportVersionFinalisationResult {
  status: 'blocked';
  readiness: ReportReadinessResult;
}

export type FinaliseReportVersionResult =
  | FinalisedReportVersionResult
  | BlockedReportVersionFinalisationResult;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const finaliseReportVersion = async (
  input: FinaliseReportVersionInput,
  dependencies: FinaliseReportVersionDependencies,
): Promise<FinaliseReportVersionResult> =>
  dependencies.reportVersionRepository.withFinalisationTransaction(
    async repositories => {
      const { report, snapshot, readiness } =
        await resolveReportReadinessSnapshot(input, repositories);

      if (report.latestVersion !== input.expectedLatestVersion) {
        throw new RepositoryConflictError(
          'Report version changed before finalisation started.',
        );
      }

      if (readiness.errors.length > 0) {
        return {
          status: 'blocked',
          readiness,
        };
      }

      const version = await getNextReportVersionNumber(
        input.reportId,
        'final',
        repositories.reportVersionRepository,
      );
      const generatedAt = toIsoDate((dependencies.now ?? (() => new Date()))());
      const created = await repositories.reportVersionRepository.create({
        reportId: input.reportId,
        version,
        status: 'final',
        generatedAt,
        snapshot: {
          ...snapshot,
          reportTitle: report.title,
        },
      });

      await repositories.reportVersionRepository.updateReportLatestVersionIfCurrent(
        input.reportId,
        input.expectedLatestVersion,
        version,
      );
      await repositories.reportVersionRepository.applyRetention(
        input.reportId,
        version,
      );

      const { filePath: _filePath, ...reportVersion } = created;

      return {
        status: 'created',
        reportVersion,
      };
    },
  );
