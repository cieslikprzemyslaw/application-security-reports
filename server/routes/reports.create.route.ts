import type { Response } from 'express';

import type { CreateReportRequest } from '../../src/domain/report.js';
import { reportResponseSchema } from '../../src/domain/schemas/index.js';
import { ValidationError } from '../../src/validation/index.js';
import {
  RepositoryConstraintError,
  RepositoryError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';

interface CreateReportRouteDependencies {
  reportRepository: ReportRepository;
  assessmentRepository: AssessmentRepository;
  threatRepository: ThreatRepository;
}

export const createReportRouteHandler = async (
  body: CreateReportRequest,
  res: Response,
  {
    reportRepository,
    assessmentRepository,
    threatRepository,
  }: CreateReportRouteDependencies,
): Promise<void> => {
  try {
    const assessment = await assessmentRepository.findById(body.assessmentId);

    if (!assessment) {
      sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
      return;
    }

    if (assessment.status === 'archived') {
      throw new ValidationError({
        error: 'VALIDATION_ERROR',
        fields: [
          {
            path: 'assessmentId',
            message: 'Archived Assessments are not selectable.',
            code: 'custom',
          },
        ],
      });
    }

    const selectedThreatIds = [...new Set(body.selectedThreatIds)];
    const selectedThreats = await Promise.all(
      selectedThreatIds.map(threatId => threatRepository.findById(threatId)),
    );
    const missingThreatIndex = selectedThreats.findIndex(
      threat => threat === null,
    );

    if (missingThreatIndex >= 0) {
      sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
      return;
    }

    const crossAssessmentThreatIndex = selectedThreats.findIndex(
      threat => threat?.assessmentId !== assessment.id,
    );

    if (crossAssessmentThreatIndex >= 0) {
      throw new ValidationError({
        error: 'VALIDATION_ERROR',
        fields: [
          {
            path: `selectedThreatIds.${crossAssessmentThreatIndex}`,
            message: 'Threat does not belong to the selected Assessment.',
            code: 'custom',
          },
        ],
      });
    }

    const report = await reportRepository.create({
      assessmentId: body.assessmentId,
      title: body.title,
      selectedThreatIds,
      executiveSummary: body.executiveSummary,
      status: 'draft',
      latestVersion: 0,
    });
    const response = reportResponseSchema.parse(report);

    res
      .location(`/api/reports/${report.id}`)
      .status(201)
      .json({ data: response });
  } catch (error) {
    if (error instanceof RepositoryConstraintError) {
      sendApiError(
        res,
        409,
        'REPORT_INVALID_RELATIONSHIP',
        'Report contains invalid related records',
      );
      return;
    }

    if (error instanceof RepositoryError) {
      console.error('Unexpected report repository error', error);
      sendApiError(
        res,
        500,
        'INTERNAL_SERVER_ERROR',
        'Unexpected server error',
      );
      return;
    }

    throw error;
  }
};
