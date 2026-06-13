import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type {
  CreateThreatInput,
  Threat,
  UpdateThreatInput,
} from '../../src/domain/threat.js';
import {
  threatListQuerySchema,
  threatRouteParamsSchema,
  createThreatRequestSchema,
  updateThreatRequestSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';

const threatResponse = (threat: Threat): Threat => ({ ...threat });

const sendThreatResponse = (
  res: Response,
  statusCode: number,
  threat: Threat,
): Response =>
  res.status(statusCode).json({
    data: threatResponse(threat),
  });

type ThreatRepositoryOperation =
  | 'list'
  | 'retrieve'
  | 'create'
  | 'update'
  | 'delete';

const handleThreatRepositoryError = (
  error: unknown,
  res: Response,
  operation: ThreatRepositoryOperation,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    if (operation === 'create' || operation === 'list') {
      sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
      return true;
    }

    sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
    return true;
  }

  if (error instanceof RepositoryConflictError) {
    sendApiError(
      res,
      409,
      'THREAT_CONFLICT',
      'A threat with the same unique value already exists',
    );
    return true;
  }

  if (error instanceof RepositoryConstraintError) {
    if (operation === 'delete') {
      sendApiError(
        res,
        409,
        'THREAT_DELETE_CONFLICT',
        'Threat cannot be deleted while related evidence or reports exist',
      );
      return true;
    }

    sendApiError(
      res,
      409,
      'THREAT_CONFLICT',
      'A threat with the same unique value already exists',
    );
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected threat repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

const ensureAssessmentExists = async (
  assessmentRepository: AssessmentRepository,
  assessmentId: string,
  res: Response,
): Promise<boolean> => {
  const assessment = await assessmentRepository.findById(assessmentId);

  if (!assessment) {
    sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    return false;
  }

  return true;
};

export const createThreatsRouter = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({
      query: threatListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { assessmentId } = res.locals.validatedRequest?.query as {
        assessmentId: string;
      };

      try {
        if (
          !(await ensureAssessmentExists(
            assessmentRepository,
            assessmentId,
            res,
          ))
        ) {
          return;
        }

        const threats = await threatRepository.findByAssessmentId(assessmentId);

        res.status(200).json({
          data: threats.map(threatResponse),
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
    createRequestValidationMiddleware({
      params: threatRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        const threat = await threatRepository.findById(id);

        if (!threat) {
          sendApiError(res, 404, 'THREAT_NOT_FOUND', 'Threat not found');
          return;
        }

        sendThreatResponse(res, 200, threat);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createThreatRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest?.body as CreateThreatInput;

      try {
        if (
          !(await ensureAssessmentExists(
            assessmentRepository,
            body.assessmentId,
            res,
          ))
        ) {
          return;
        }

        const threat = await threatRepository.create(body);
        const response = res.location(`/api/threats/${threat.id}`);

        sendThreatResponse(response, 201, threat);
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
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };
      const body = res.locals.validatedRequest?.body as UpdateThreatInput;

      try {
        const updatedThreat = await threatRepository.update(id, body);

        sendThreatResponse(res, 200, updatedThreat);
      } catch (error) {
        if (!handleThreatRepositoryError(error, res, 'update')) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id',
    createRequestValidationMiddleware({
      params: threatRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

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
