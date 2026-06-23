import type { NextFunction, Request, Response } from 'express';

import type { Settings } from '../../src/domain/settings.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import { sendApiError } from '../http/api-errors.js';

const settingsResponse = (settings: Settings): Settings => ({ ...settings });

export const sendSettingsResponse = (
  res: Response,
  statusCode: number,
  settings: Settings,
): Response =>
  res.status(statusCode).json({
    data: settingsResponse(settings),
  });

export const handleSettingsRepositoryError = (
  error: unknown,
  res: Response,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected settings repository error', error);
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
