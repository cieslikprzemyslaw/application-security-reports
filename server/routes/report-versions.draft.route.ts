import { Router } from 'express';

import type {
  CreateDraftReportVersionRequest,
  ReportVersion,
  ReportVersionResponse,
} from '../../src/domain/report.js';
import {
  createDraftReportVersionRequestSchema,
  reportRouteParamsSchema,
  reportVersionResponseSchema,
} from '../../src/domain/schemas/index.js';
import { RepositoryConflictError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  createDraftReportVersion,
  DraftReportNotFoundError,
} from '../services/report-version-draft.service.js';
import { ReportVersionSequenceExhaustedError } from '../services/report-version-numbering.service.js';
import { buildBaseUrl } from './companies.route.shared.js';
import { handleReportPreviewGenerationError } from './reports.preview.route.js';
import { asyncRoute } from './settings.route.shared.js';

const toReportVersionResponse = (
  version: ReportVersion,
): ReportVersionResponse => {
  const { filePath: _filePath, ...response } = version;
  return response;
};

export interface ReportVersionDraftRouteRepositories {
  assessmentRepository: AssessmentRepository;
  companyRepository: CompanyRepository;
  evidenceRepository: EvidenceRepository;
  reportRepository: ReportRepository;
  reportVersionRepository: ReportVersionRepository;
  settingsRepository: SettingsRepository;
  threatRepository: ThreatRepository;
}

export const createReportVersionsDraftRouter = (
  repositories: ReportVersionDraftRouteRepositories,
): Router => {
  const router = Router();

  router.post(
    '/:id/versions/draft',
    createRequestValidationMiddleware({
      params: reportRouteParamsSchema,
      body: createDraftReportVersionRequestSchema,
    }),
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const request = res.locals.validatedRequest
        ?.body as CreateDraftReportVersionRequest;

      try {
        const version = await createDraftReportVersion(
          {
            reportId: id,
            request,
            baseUrl: buildBaseUrl(req),
          },
          repositories,
        );

        res.status(201).json({
          data: reportVersionResponseSchema.parse(
            toReportVersionResponse(version),
          ),
        });
      } catch (error) {
        if (error instanceof DraftReportNotFoundError) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
          return;
        }

        if (error instanceof ReportVersionSequenceExhaustedError) {
          sendApiError(
            res,
            409,
            'REPORT_VERSION_SEQUENCE_EXHAUSTED',
            'Report draft version sequence is exhausted',
          );
          return;
        }

        if (error instanceof RepositoryConflictError) {
          sendApiError(
            res,
            409,
            'REPORT_VERSION_CONFLICT',
            'Report version could not be created because the version changed',
          );
          return;
        }

        if (handleReportPreviewGenerationError(error, res)) {
          return;
        }

        throw error;
      }
    }),
  );

  return router;
};
