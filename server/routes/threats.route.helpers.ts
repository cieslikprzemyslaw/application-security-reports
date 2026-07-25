import type { NextFunction, Request, Response } from 'express';

import type { Assessment } from '../../src/domain/assessment.js';
import {
  getThreatReviewActions,
  type ThreatReviewCommand,
} from '../../src/domain/threatReview.js';
import type {
  CreateThreatInput,
  Threat,
  ThreatResponse,
  UpdateThreatInput,
} from '../../src/domain/threat.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import { sendApiError } from '../http/api-errors.js';

export type ThreatValidatedRequest = {
  body?: CreateThreatInput | UpdateThreatInput | { recordVersion: number };
  params?: {
    id: string;
    command?: ThreatReviewCommand;
  };
  query?: {
    assessmentId: string;
  };
};

export const toThreatResponse = (
  threat: Threat,
  assessment: Assessment,
): ThreatResponse => ({
  ...threat,
  assessmentOwaspTaxonomyVersion: assessment.owaspTaxonomyVersion,
  recordVersion: new Date(threat.updatedAt).getTime(),
  reviewActions: getThreatReviewActions(threat, assessment.status),
});

export const sendThreatResponse = (
  res: Response,
  statusCode: number,
  threat: Threat,
  assessment: Assessment,
): Response =>
  res.status(statusCode).json({
    data: toThreatResponse(threat, assessment),
  });

type ThreatRepositoryOperation =
  | 'list'
  | 'retrieve'
  | 'create'
  | 'update'
  | 'transition'
  | 'delete';

export const handleThreatRepositoryError = (
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
    if (operation === 'transition') {
      sendApiError(
        res,
        409,
        'RESOURCE_MODIFIED',
        'The Threat changed before the review action completed',
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

  if (error instanceof RepositoryStateError && operation === 'transition') {
    sendApiError(res, 409, 'THREAT_TRANSITION_NOT_ALLOWED', error.message);
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

export const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const ensureAssessmentExists = async (
  assessmentRepository: AssessmentRepository,
  assessmentId: string,
  res: Response,
): Promise<Assessment | null> => {
  const assessment = await assessmentRepository.findById(assessmentId);

  if (!assessment) {
    sendApiError(res, 404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    return null;
  }

  return assessment;
};
