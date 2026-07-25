import { Router } from 'express';

import type { ThreatReviewCommand } from '../../src/domain/threatReview.js';
import type {
  CreateThreatInput,
  UpdateThreatInput,
} from '../../src/domain/threat.js';
import {
  createThreatRequestSchema,
  threatListQuerySchema,
  threatReviewCommandRequestSchema,
  threatReviewCommandRouteParamsSchema,
  threatRouteParamsSchema,
  updateThreatRequestSchema,
} from '../../src/domain/schemas/index.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import {
  hasThreatReviewOperations,
  type ThreatRepository,
} from '../database/repositories/threat.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  asyncRoute,
  ensureAssessmentExists,
  handleThreatRepositoryError,
  sendThreatResponse,
  toThreatResponse,
  type ThreatValidatedRequest,
} from './threats.route.helpers.js';

export const createThreatsRouter = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({ query: threatListQuerySchema }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const { assessmentId } = validatedRequest.query as {
        assessmentId: string;
      };
      const assessment = await ensureAssessmentExists(
        assessmentRepository,
        assessmentId,
        res,
      );

      if (!assessment) {
        return;
      }

      try {
        const threats = await threatRepository.findByAssessmentId(assessmentId);

        res.status(200).json({
          data: threats.map(threat => toThreatResponse(threat, assessment)),
        });
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'list')) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({ params: threatRouteParamsSchema }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const { id } = validatedRequest.params as { id: string };

      try {
        const threat = await threatRepository.findById(id);

        if (!threat) {
          sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
          return;
        }

        const assessment = await ensureAssessmentExists(
          assessmentRepository,
          threat.assessmentId,
          res,
        );

        if (!assessment) {
          return;
        }

        sendThreatResponse(res, 200, threat, assessment);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({ body: createThreatRequestSchema }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const body = validatedRequest.body as CreateThreatInput;

      try {
        const assessment = await ensureAssessmentExists(
          assessmentRepository,
          body.assessmentId,
          res,
        );

        if (!assessment) {
          return;
        }

        const threat = await threatRepository.create(body);
        const response = res.location(`/api/threats/${threat.id}`);

        sendThreatResponse(response, 201, threat, assessment);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'create')) {
          throw error;
        }
      }
    }),
  );

  router.patch(
    '/:id',
    createRequestValidationMiddleware({
      params: threatRouteParamsSchema,
      body: updateThreatRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const { id } = validatedRequest.params as { id: string };
      const body = validatedRequest.body as UpdateThreatInput;

      try {
        const existingThreat = await threatRepository.findById(id);

        if (!existingThreat) {
          sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
          return;
        }

        const assessment = await ensureAssessmentExists(
          assessmentRepository,
          existingThreat.assessmentId,
          res,
        );

        if (!assessment) {
          return;
        }

        const updatedThreat = await threatRepository.update(id, body);

        sendThreatResponse(res, 200, updatedThreat, assessment);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'update')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/:id/commands/:command',
    createRequestValidationMiddleware({
      params: threatReviewCommandRouteParamsSchema,
      body: threatReviewCommandRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const { id, command } = validatedRequest.params as {
        id: string;
        command: ThreatReviewCommand;
      };
      const { recordVersion } = validatedRequest.body as {
        recordVersion: number;
      };

      if (!hasThreatReviewOperations(threatRepository)) {
        sendApiError(
          res,
          500,
          'INTERNAL_SERVER_ERROR',
          'Unexpected server error',
        );
        return;
      }

      try {
        const existingThreat = await threatRepository.findById(id);

        if (!existingThreat) {
          sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
          return;
        }

        const assessment = await ensureAssessmentExists(
          assessmentRepository,
          existingThreat.assessmentId,
          res,
        );

        if (!assessment) {
          return;
        }

        if (assessment.status === 'archived') {
          sendApiError(
            res,
            409,
            'THREAT_TRANSITION_NOT_ALLOWED',
            'Archived Assessments are read-only',
          );
          return;
        }

        await threatRepository.transitionReview(id, command, recordVersion);
        const updatedThreat = await threatRepository.findById(id);

        if (!updatedThreat) {
          sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
          return;
        }

        sendThreatResponse(res, 200, updatedThreat, assessment);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'transition')) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id',
    createRequestValidationMiddleware({ params: threatRouteParamsSchema }),
    asyncRoute(async (_req, res) => {
      const validatedRequest = res.locals
        .validatedRequest as ThreatValidatedRequest;
      const { id } = validatedRequest.params as { id: string };

      try {
        await threatRepository.delete(id);
        res.status(204).send();
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'delete')) {
          throw error;
        }
      }
    }),
  );

  return router;
};
