import type { Response } from 'express';

import type { ValidationFieldError } from '../../src/validation/index.js';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'NOT_FOUND'
  | 'COMPANY_NOT_FOUND'
  | 'COMPANY_CONFLICT'
  | 'COMPANY_DELETE_CONFLICT'
  | 'ASSESSMENT_NOT_FOUND'
  | 'ASSESSMENT_CONFLICT'
  | 'ASSESSMENT_DELETE_CONFLICT'
  | 'THREAT_NOT_FOUND'
  | 'THREAT_CONFLICT'
  | 'THREAT_DELETE_CONFLICT'
  | 'SETTINGS_NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details: ValidationFieldError[];
  };
}

export const sendApiError = (
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details: ValidationFieldError[] = [],
): Response => {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      details,
    },
  };

  return res.status(statusCode).json(payload);
};
