import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import type {
  CreateEvidenceInput,
  Evidence,
  UpdateEvidenceInput,
} from '../../src/domain/evidence.js';
import {
  evidenceListQuerySchema,
  evidenceRouteParamsSchema,
  createEvidenceRequestSchema,
  updateEvidenceRequestSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { ValidationFieldError } from '../../src/validation/index.js';
import {
  sendValidationError,
  validateEvidenceExchangeUpdate,
  validateEvidenceFileMetadataUpdate,
} from './helpers.js';

type CreateEvidenceRequestBody = Omit<
  CreateEvidenceInput,
  'filePath' | 'storageKey'
>;
type UpdateEvidenceRequestBody = Omit<
  UpdateEvidenceInput,
  'filePath' | 'storageKey'
>;

const evidenceResponse = (evidence: Evidence): Evidence => ({ ...evidence });

const sendEvidenceResponse = (
  res: Response,
  statusCode: number,
  evidence: Evidence,
): Response =>
  res.status(statusCode).json({
    data: evidenceResponse(evidence),
  });

const handleEvidenceRepositoryError = (
  error: unknown,
  res: Response,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'EVIDENCE_NOT_FOUND', 'Evidence not found');
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected evidence repository error', error);
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

const validateAssessmentExists = async (
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

const validateEvidenceThreatLinks = async (
  threatRepository: ThreatRepository,
  assessmentId: string,
  threatIds: readonly string[] | undefined,
  res: Response,
): Promise<boolean> => {
  if (!threatIds || threatIds.length === 0) {
    return true;
  }

  const issues: ValidationFieldError[] = [];

  for (const [index, threatId] of threatIds.entries()) {
    try {
      const threat = await threatRepository.findById(threatId);

      if (!threat) {
        issues.push({
          path: `threatIds.${index}`,
          message: 'Threat not found',
          code: 'custom',
        });
        continue;
      }

      if (threat.assessmentId !== assessmentId) {
        issues.push({
          path: `threatIds.${index}`,
          message: 'Threat must belong to the selected assessment',
          code: 'custom',
        });
      }
    } catch (error) {
      if (error instanceof RepositoryError) {
        console.error('Unexpected evidence threat validation error', error);
        sendApiError(
          res,
          500,
          'INTERNAL_SERVER_ERROR',
          'Unexpected server error',
        );
        return false;
      }

      throw error;
    }
  }

  if (issues.length > 0) {
    sendValidationError(res, issues);
    return false;
  }

  return true;
};

export const createEvidenceRouter = (
  assessmentRepository: AssessmentRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({
      query: evidenceListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { assessmentId } = res.locals.validatedRequest?.query as {
        assessmentId: string;
      };

      try {
        if (
          !(await validateAssessmentExists(
            assessmentRepository,
            assessmentId,
            res,
          ))
        ) {
          return;
        }

        const evidence =
          await evidenceRepository.findByAssessmentId(assessmentId);

        res.status(200).json({
          data: evidence.map(evidenceResponse),
        });
      } catch (error) {
        if (!handleEvidenceRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: evidenceRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        const evidence = await evidenceRepository.findById(id);

        if (!evidence) {
          sendApiError(res, 404, 'EVIDENCE_NOT_FOUND', 'Evidence not found');
          return;
        }
        sendEvidenceResponse(res, 200, evidence);
      } catch (error) {
        if (!handleEvidenceRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createEvidenceRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest
        ?.body as CreateEvidenceRequestBody;

      try {
        if (
          !(await validateAssessmentExists(
            assessmentRepository,
            body.assessmentId,
            res,
          ))
        ) {
          return;
        }
        if (
          !(await validateEvidenceThreatLinks(
            threatRepository,
            body.assessmentId,
            body.threatIds,
            res,
          ))
        ) {
          return;
        }

        const evidence = await evidenceRepository.create(body);
        const response = res.location(`/api/evidence/${evidence.id}`);

        sendEvidenceResponse(response, 201, evidence);
      } catch (error) {
        if (!handleEvidenceRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.patch(
    '/:id',
    createRequestValidationMiddleware({
      params: evidenceRouteParamsSchema,
      body: updateEvidenceRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };
      const body = res.locals.validatedRequest
        ?.body as UpdateEvidenceRequestBody;
      try {
        const existingEvidence = await evidenceRepository.findById(id);
        if (!existingEvidence) {
          sendApiError(res, 404, 'EVIDENCE_NOT_FOUND', 'Evidence not found');
          return;
        }
        if (
          !(await validateAssessmentExists(
            assessmentRepository,
            existingEvidence.assessmentId,
            res,
          ))
        ) {
          return;
        }
        if (
          !validateEvidenceFileMetadataUpdate(existingEvidence, body, res) ||
          !validateEvidenceExchangeUpdate(existingEvidence, body, res)
        ) {
          return;
        }
        if (
          body.threatIds &&
          !(await validateEvidenceThreatLinks(
            threatRepository,
            existingEvidence.assessmentId,
            body.threatIds,
            res,
          ))
        ) {
          return;
        }

        const updatedEvidence = await evidenceRepository.update(id, body);
        sendEvidenceResponse(res, 200, updatedEvidence);
      } catch (error) {
        if (!handleEvidenceRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id',
    createRequestValidationMiddleware({
      params: evidenceRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        await evidenceRepository.delete(id);
        res.status(204).send();
      } catch (error) {
        if (!handleEvidenceRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
