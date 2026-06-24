import { Router, type Response } from 'express';

import type {
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '../../src/domain/report-preview.js';
import {
  reportPreviewRequestSchema,
  reportPreviewSnapshotSchema,
} from '../../src/domain/schemas/index.js';
import { RepositoryError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  generateReportPreviewSnapshot,
  ReportPreviewGenerationNotFoundError,
} from '../services/report-preview-generation.service.js';
import { ReportPreviewSelectionNotFoundError } from '../services/report-preview-selection.service.js';
import { buildBaseUrl } from './companies.route.shared.js';
import { asyncRoute } from './settings.route.shared.js';

export type ReportPreviewRepositories = {
  assessmentRepository: AssessmentRepository;
  companyRepository: CompanyRepository;
  evidenceRepository: EvidenceRepository;
  settingsRepository: SettingsRepository;
  threatRepository: ThreatRepository;
};

const sendPreviewResponse = (
  res: Response,
  snapshot: ReportPreviewSnapshot,
): Response =>
  res.status(200).json({
    data: reportPreviewSnapshotSchema.parse(snapshot),
  });

const handleMissingSelection = (
  error: ReportPreviewSelectionNotFoundError,
  res: Response,
): void => {
  const mapping = {
    assessment: {
      code: 'ASSESSMENT_NOT_FOUND' as const,
      message: 'Assessment not found',
    },
    threat: {
      code: 'THREAT_NOT_FOUND' as const,
      message: 'Threat not found',
    },
    evidence: {
      code: 'EVIDENCE_NOT_FOUND' as const,
      message: 'Evidence not found',
    },
  };

  const response = mapping[error.resource];
  sendApiError(res, 404, response.code, response.message);
};

export const handleReportPreviewGenerationError = (
  error: unknown,
  res: Response,
): boolean => {
  if (error instanceof ReportPreviewSelectionNotFoundError) {
    handleMissingSelection(error, res);
    return true;
  }

  if (error instanceof ReportPreviewGenerationNotFoundError) {
    if (error.resource === 'company') {
      sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
    } else {
      sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
    }
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected report preview repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

export const createReportsPreviewRouter = (
  repositories: ReportPreviewRepositories,
): Router => {
  const router = Router();

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: reportPreviewRequestSchema,
    }),
    asyncRoute(async (req, res) => {
      const request = res.locals.validatedRequest?.body as ReportPreviewRequest;

      try {
        const snapshot = await generateReportPreviewSnapshot(
          request,
          repositories,
          buildBaseUrl(req),
        );

        sendPreviewResponse(res, snapshot);
      } catch (error) {
        if (!handleReportPreviewGenerationError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
