import { randomUUID } from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import express, { Router } from 'express';

import { companyRouteParamsSchema } from '../../src/domain/schemas/index.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  CompanyLogoStorageError,
  CompanyLogoValidationError,
  type CompanyLogoStorage,
} from '../services/companyLogoStorage.js';
import {
  asyncRoute,
  handleCompanyRepositoryError,
  sendCompanyResponse,
} from './companies.route.shared.js';

const logoContentTypeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export const createCompanyLogoRouter = (
  companyRepository: CompanyRepository,
  logoStorage: CompanyLogoStorage | undefined,
): Router => {
  const router = Router();

  router.put(
    '/:id/logo',
    express.raw({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      limit: '5mb',
    }),
    createRequestValidationMiddleware({ params: companyRouteParamsSchema }),
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      if (!logoStorage) {
        sendApiError(
          res,
          500,
          'INTERNAL_SERVER_ERROR',
          'Unexpected server error',
        );
        return;
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        sendApiError(
          res,
          422,
          'LOGO_VALIDATION_ERROR',
          'Logo file body is required',
        );
        return;
      }

      const fileName = (req.get('X-File-Name') ?? '').trim();
      const mimeType = (req.get('Content-Type') ?? '').split(';')[0].trim();
      const fileBytes = req.body;

      try {
        const validatedFile = logoStorage.validateCompanyLogoFile({
          fileName,
          mimeType,
          sizeBytes: fileBytes.length,
          bytes: fileBytes,
        });

        const company = await companyRepository.findById(id);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        const previousStorageKey = company.logoUrl ?? undefined;
        const newStorageKey = logoStorage.buildCompanyLogoStorageKey(
          id,
          validatedFile.fileName,
        );
        const tmpPath = path.join(
          os.tmpdir(),
          'company-logo-' + randomUUID() + '.tmp',
        );

        try {
          await fsPromises.writeFile(tmpPath, fileBytes);
          await logoStorage.stageCompanyLogoReplacement({
            sourcePath: tmpPath,
            targetStorageKey: newStorageKey,
            previousStorageKey,
          });
        } finally {
          await fsPromises.rm(tmpPath, { force: true }).catch(() => undefined);
        }

        const updatedCompany = await companyRepository.updateLogoUrl(
          id,
          newStorageKey,
        );

        sendCompanyResponse(req, res, 200, updatedCompany);
      } catch (error) {
        if (error instanceof CompanyLogoValidationError) {
          sendApiError(res, 422, 'LOGO_VALIDATION_ERROR', error.message);
          return;
        }

        if (error instanceof CompanyLogoStorageError) {
          console.error('Company logo storage error', error);
          sendApiError(
            res,
            500,
            'INTERNAL_SERVER_ERROR',
            'Unexpected server error',
          );
          return;
        }

        if (!handleCompanyRepositoryError(error, res, 'update')) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id/logo',
    createRequestValidationMiddleware({ params: companyRouteParamsSchema }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const company = await companyRepository.findById(id);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        if (!company.logoUrl || !logoStorage) {
          sendApiError(
            res,
            404,
            'COMPANY_LOGO_NOT_FOUND',
            'Company logo not found',
          );
          return;
        }

        const fileBuffer = await logoStorage.readCompanyLogoFile(
          company.logoUrl,
        );
        const ext = path.extname(company.logoUrl).toLowerCase();
        const contentType =
          logoContentTypeByExtension[ext] ?? 'application/octet-stream';

        res.status(200).setHeader('Content-Type', contentType).send(fileBuffer);
      } catch (error) {
        if (error instanceof CompanyLogoStorageError) {
          console.error('Company logo storage error', error);
          sendApiError(
            res,
            500,
            'INTERNAL_SERVER_ERROR',
            'Unexpected server error',
          );
          return;
        }

        if (!handleCompanyRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id/logo',
    createRequestValidationMiddleware({ params: companyRouteParamsSchema }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const company = await companyRepository.findById(id);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        if (company.logoUrl && logoStorage) {
          try {
            await logoStorage.deleteCompanyLogoFile(company.logoUrl);
          } catch (storageError) {
            console.warn(
              'Failed to delete company logo file during logo removal',
              storageError,
            );
          }
        }

        await companyRepository.updateLogoUrl(id, null);
        res.status(204).send();
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'delete')) {
          throw error;
        }
      }
    }),
  );

  return router;
};
