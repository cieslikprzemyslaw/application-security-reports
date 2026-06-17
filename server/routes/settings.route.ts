import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type { Settings } from '../../src/domain/settings.js';
import {
  createSettingsRequestSchema,
  updateSettingsRequestSchema,
} from '../../src/domain/schemas/index.js';
import { formatValidationErrors } from '../../src/validation/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';

const settingsResponse = (settings: Settings): Settings => ({ ...settings });

const sendSettingsResponse = (
  res: Response,
  statusCode: number,
  settings: Settings,
): Response =>
  res.status(statusCode).json({
    data: settingsResponse(settings),
  });

const handleSettingsRepositoryError = (
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

const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createSettingsRouter = (
  settingsRepository: SettingsRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      try {
        const settings = await settingsRepository.get();

        if (!settings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        sendSettingsResponse(res, 200, settings);
      } catch (error) {
        if (!handleSettingsRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.patch(
    '/',
    createRequestValidationMiddleware({
      body: updateSettingsRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest?.body as {
        organisationName?: string;
        consultantName?: string;
        consultantEmail?: string;
        issuerLogoId?: string;
        defaultReportTitle?: string;
        defaultSeverity?: Settings['defaultSeverity'];
        theme?: Settings['theme'];
        dateFormat?: Settings['dateFormat'];
        reportFooterText?: string;
        reportConfidentialityLabel?: string;
        methodology?: string;
        reportStyle?: string;
        includeEvidence?: boolean;
        confidentialReports?: boolean;
        allowedBrandingModes?: Settings['allowedBrandingModes'];
        defaultBrandingMode?: Settings['defaultBrandingMode'];
      };

      try {
        const existingSettings = await settingsRepository.get();

        if (!existingSettings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        const {
          id: _id,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...existingInput
        } = existingSettings;
        const effectiveResult = createSettingsRequestSchema.safeParse({
          ...existingInput,
          ...body,
        });

        if (!effectiveResult.success) {
          sendApiError(
            res,
            400,
            'VALIDATION_ERROR',
            'Request validation failed',
            formatValidationErrors(effectiveResult.error).fields,
          );
          return;
        }
        const settings = await settingsRepository.upsert(effectiveResult.data);

        sendSettingsResponse(res, 200, settings);
      } catch (error) {
        if (!handleSettingsRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
