import type { ErrorRequestHandler, RequestHandler } from 'express';

import { JsonParseError, ValidationError } from '../../src/validation/index.js';
import { sendApiError } from './api-errors.js';

const isBodyParserSyntaxError = (error: unknown): error is SyntaxError => {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  return (
    'type' in error &&
    typeof error.type === 'string' &&
    error.type === 'entity.parse.failed'
  );
};

const isPayloadTooLargeError = (
  error: unknown,
): error is Error & { type: string } => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    'type' in error &&
    typeof error.type === 'string' &&
    error.type === 'entity.too.large'
  );
};

export const apiNotFoundHandler: RequestHandler = (_req, res) => {
  sendApiError(res, 404, 'NOT_FOUND', 'API route not found');
};

export const apiErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ValidationError) {
    sendApiError(
      res,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      error.response.fields,
    );
    return;
  }

  if (error instanceof JsonParseError || isBodyParserSyntaxError(error)) {
    sendApiError(res, 400, 'INVALID_JSON', 'Malformed JSON request body');
    return;
  }

  if (isPayloadTooLargeError(error)) {
    sendApiError(
      res,
      413,
      'PAYLOAD_TOO_LARGE',
      'JSON request body exceeds 1mb limit',
    );
    return;
  }

  console.error('Unhandled API error', error);
  sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
};
