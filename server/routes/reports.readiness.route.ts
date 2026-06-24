import { Router } from 'express';

import type { ReportReadinessResult } from '../../src/domain/report-readiness.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import {
  reportPreviewRequestSchema,
  reportReadinessResultSchema,
  reportRouteParamsSchema,
} from '../../src/domain/schemas/index.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  ReportReadinessReportNotFoundError,
  resolveReportReadiness,
} from '../services/report-readiness.service.js';
import { buildBaseUrl } from './companies.route.shared.js';
import { handleReportPreviewGenerationError } from './reports.preview.route.js';
import { asyncRoute } from './settings.route.shared.js';

export interface ReportReadinessRouteRepositories {
  assessmentRepository: AssessmentRepository;
  companyRepository: CompanyRepository;
  evidenceRepository: EvidenceRepository;
  reportRepository: ReportRepository;
  settingsRepository: SettingsRepository;
  threatRepository: ThreatRepository;
}

const sendReadinessResponse = (
  readiness: ReportReadinessResult,
): { data: ReportReadinessResult } => ({
  data: reportReadinessResultSchema.parse(readiness),
});

export const createReportsReadinessRouter = (
  repositories: ReportReadinessRouteRepositories,
): Router => {
  const router = Router();

  router.post(
    '/:id/readiness',
    createRequestValidationMiddleware({
      params: reportRouteParamsSchema,
      body: reportPreviewRequestSchema,
    }),
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const request = res.locals.validatedRequest?.body as ReportPreviewRequest;

      try {
        const readiness = await resolveReportReadiness(
          {
            reportId: id,
            request,
            baseUrl: buildBaseUrl(req),
          },
          repositories,
        );

        res.status(200).json(sendReadinessResponse(readiness));
      } catch (error) {
        if (error instanceof ReportReadinessReportNotFoundError) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
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
