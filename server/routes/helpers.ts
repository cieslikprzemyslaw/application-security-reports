import { type Response } from 'express';

import type { Evidence } from '../../src/domain/evidence.js';

import { sendApiError } from '../http/api-errors.js';
import type { ValidationFieldError } from '../../src/validation/index.js';
import {
  isEvidenceFileNameCompatibleWithMimeType,
  SupportedEvidenceMimeType,
} from '../../src/domain/schemas/evidence-request.schema.js';
import { UpdateEvidenceRequestBody } from './routes.types.js';

export const sendValidationError = (
  res: Response,
  details: ValidationFieldError[],
): void => {
  sendApiError(
    res,
    400,
    'VALIDATION_ERROR',
    'Request validation failed',
    details,
  );
};

export const validateEvidenceFileMetadataUpdate = (
  existingEvidence: Evidence,
  body: UpdateEvidenceRequestBody,
  res: Response,
): boolean => {
  if (body.fileName === undefined && body.mimeType === undefined) {
    return true;
  }

  const fileName = body.fileName ?? existingEvidence.fileName;
  const mimeType = body.mimeType ?? existingEvidence.mimeType;

  if (
    fileName &&
    mimeType &&
    !isEvidenceFileNameCompatibleWithMimeType(
      fileName,
      mimeType as SupportedEvidenceMimeType,
    )
  ) {
    sendValidationError(res, [
      {
        path: 'fileName',
        message:
          'Evidence file name extension must match the supplied mime type',
        code: 'custom',
      },
    ]);
    return false;
  }

  return true;
};

export const validateEvidenceExchangeUpdate = (
  existingEvidence: Evidence,
  body: UpdateEvidenceRequestBody,
  res: Response,
): boolean => {
  const resultingType = body.type ?? existingEvidence.type;
  const hasExplicitHttpExchanges = body.httpExchanges !== undefined;
  const resultingHttpExchanges = hasExplicitHttpExchanges
    ? body.httpExchanges
    : existingEvidence.httpExchanges;

  if (resultingType === 'http') {
    if (!resultingHttpExchanges || resultingHttpExchanges.length === 0) {
      sendValidationError(res, [
        {
          path: 'httpExchanges',
          message: 'HTTP evidence must include at least one exchange',
          code: 'custom',
        },
      ]);
      return false;
    }

    return true;
  }

  if (!resultingHttpExchanges || resultingHttpExchanges.length === 0) {
    return true;
  }

  if (
    existingEvidence.type === 'http' &&
    body.type !== undefined &&
    body.type !== 'http' &&
    !hasExplicitHttpExchanges
  ) {
    sendValidationError(res, [
      {
        path: 'httpExchanges',
        message:
          'HTTP evidence exchanges must be cleared when changing evidence to a non-HTTP type',
        code: 'custom',
      },
    ]);
    return false;
  }

  sendValidationError(res, [
    {
      path: 'httpExchanges',
      message: 'Only HTTP evidence can include exchanges',
      code: 'custom',
    },
  ]);
  return false;
};
