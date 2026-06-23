import express, { Router } from 'express';

import type { Settings } from '../../src/domain/settings.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import { sendApiError } from '../http/api-errors.js';
import {
  IssuerLogoStorageError,
  IssuerLogoValidationError,
  type IssuerLogoStorage,
} from '../services/issuerLogoStorage.js';
import {
  asyncRoute,
  handleSettingsRepositoryError,
  sendSettingsResponse,
} from './settings.route.shared.js';

const parseContentLength = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!/^(0|[1-9]\d*)$/.test(value)) {
    throw new IssuerLogoValidationError(
      'Issuer logo content length must be a non-negative integer',
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new IssuerLogoValidationError(
      'Issuer logo content length is invalid',
    );
  }

  return parsed;
};

export const createSettingsLogoRouter = (
  settingsRepository: SettingsRepository,
  issuerLogoStorage: IssuerLogoStorage,
): Router => {
  const router = Router();

  router.put(
    '/',
    express.raw({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      limit: '5mb',
    }),
    asyncRoute(async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        sendApiError(
          res,
          422,
          'LOGO_VALIDATION_ERROR',
          'Logo file body is required',
        );
        return;
      }

      try {
        const fileBytes = req.body;
        const declaredSizeBytes = parseContentLength(
          req.get('Content-Length') ?? undefined,
        );
        const validatedFile = issuerLogoStorage.validateIssuerLogoFile({
          fileName: (req.get('X-File-Name') ?? '').trim(),
          mimeType: (req.get('Content-Type') ?? '').split(';')[0].trim(),
          sizeBytes: declaredSizeBytes ?? fileBytes.length,
          bytes: fileBytes,
        });
        const existingSettings = await settingsRepository.get();

        if (!existingSettings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        const previousLogoId = existingSettings.issuerLogoId;
        const nextLogoId = issuerLogoStorage.createIssuerLogoId();

        await issuerLogoStorage.stageIssuerLogoFile({
          logoId: nextLogoId,
          fileName: validatedFile.fileName,
          bytes: fileBytes,
        });

        let updatedSettings: Settings;

        try {
          updatedSettings =
            await settingsRepository.updateIssuerLogoId(nextLogoId);
        } catch (error) {
          await issuerLogoStorage
            .deleteIssuerLogoFile(nextLogoId)
            .catch(cleanupError => {
              console.warn(
                'Failed to clean up staged issuer logo after Settings update failure',
                cleanupError,
              );
            });

          if (!handleSettingsRepositoryError(error, res)) {
            throw error;
          }

          return;
        }

        if (previousLogoId && previousLogoId !== nextLogoId) {
          await issuerLogoStorage
            .deleteIssuerLogoFile(previousLogoId)
            .catch(cleanupError => {
              console.warn(
                'Failed to clean up replaced issuer logo file',
                cleanupError,
              );
            });
        }

        sendSettingsResponse(res, 200, updatedSettings);
      } catch (error) {
        if (error instanceof IssuerLogoValidationError) {
          sendApiError(res, 422, 'LOGO_VALIDATION_ERROR', error.message);
          return;
        }

        if (error instanceof IssuerLogoStorageError) {
          console.error('Issuer logo storage error', error);
          sendApiError(
            res,
            500,
            'INTERNAL_SERVER_ERROR',
            'Unexpected server error',
          );
          return;
        }

        if (!handleSettingsRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      try {
        const settings = await settingsRepository.get();

        if (!settings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        if (!settings.issuerLogoId) {
          sendApiError(
            res,
            404,
            'ISSUER_LOGO_NOT_FOUND',
            'Issuer logo not found',
          );
          return;
        }

        const file = await issuerLogoStorage.readIssuerLogoFile(
          settings.issuerLogoId,
        );

        res
          .status(200)
          .setHeader('Content-Type', file.mimeType)
          .setHeader('Content-Length', file.bytes.length)
          .send(file.bytes);
      } catch (error) {
        if (error instanceof IssuerLogoStorageError) {
          console.error('Issuer logo storage error', error);
          sendApiError(
            res,
            500,
            'INTERNAL_SERVER_ERROR',
            'Unexpected server error',
          );
          return;
        }

        if (!handleSettingsRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/',
    asyncRoute(async (_req, res) => {
      try {
        const settings = await settingsRepository.get();

        if (!settings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        if (!settings.issuerLogoId) {
          res.status(204).send();
          return;
        }

        const previousLogoId = settings.issuerLogoId;

        try {
          await settingsRepository.updateIssuerLogoId(null);
        } catch (error) {
          if (!handleSettingsRepositoryError(error, res)) {
            throw error;
          }

          return;
        }

        await issuerLogoStorage
          .deleteIssuerLogoFile(previousLogoId)
          .catch(cleanupError => {
            console.warn(
              'Failed to clean up unreferenced issuer logo file',
              cleanupError,
            );
          });

        res.status(204).send();
      } catch (error) {
        if (!handleSettingsRepositoryError(error, res)) {
          throw error;
        }
      }
    }),
  );

  return router;
};
