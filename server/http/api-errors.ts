import type { Response } from 'express';

import type { ValidationFieldError } from '../../src/validation/index.js';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'NOT_FOUND'
  | 'COMPANY_NOT_FOUND'
  | 'COMPANY_CONFLICT'
  | 'COMPANY_DELETE_CONFLICT'
  | 'COMPANY_ALREADY_ARCHIVED'
  | 'COMPANY_NOT_ARCHIVED'
  | 'COMPANY_LOGO_NOT_FOUND'
  | 'LOGO_VALIDATION_ERROR'
  | 'ASSESSMENT_NOT_FOUND'
  | 'ASSESSMENT_CONFLICT'
  | 'ASSESSMENT_DELETE_CONFLICT'
  | 'RESOURCE_MODIFIED'
  | 'THREAT_NOT_FOUND'
  | 'THREAT_CONFLICT'
  | 'THREAT_DELETE_CONFLICT'
  | 'EVIDENCE_NOT_FOUND'
  | 'REPORT_NOT_FOUND'
  | 'REPORT_INVALID_RELATIONSHIP'
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
