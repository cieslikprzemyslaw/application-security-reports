import type { NextFunction, Request, Response } from 'express';

import type { Company } from '../../src/domain/company.js';
import { companyPublicSchema } from '../../src/domain/schemas/index.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../database/errors.js';
import { sendApiError } from '../http/api-errors.js';
import type {
  CompanyRepositoryOperation,
  CompanyResponse,
} from './companies.route.types.js';

export const buildBaseUrl = (req: Request): string =>
  req.protocol + '://' + (req.get('host') ?? 'localhost');

export const companyResponse = (
  company: Company,
  baseUrl: string,
): CompanyResponse =>
  companyPublicSchema.parse({
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    contactName: company.contactName,
    contactEmail: company.contactEmail,
    logoUrl: company.logoUrl
      ? baseUrl + '/api/companies/' + company.id + '/logo'
      : null,
    footerText: company.footerText,
    archivedAt: company.archivedAt ?? null,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  });

export const sendCompanyResponse = (
  req: Request,
  res: Response,
  statusCode: number,
  company: Company,
): Response =>
  res.status(statusCode).json({
    data: companyResponse(company, buildBaseUrl(req)),
  });

export const handleCompanyRepositoryError = (
  error: unknown,
  res: Response,
  operation: CompanyRepositoryOperation,
): boolean => {
  if (error instanceof RepositoryNotFoundError) {
    sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
    return true;
  }

  if (error instanceof RepositoryConflictError) {
    sendApiError(
      res,
      409,
      'COMPANY_CONFLICT',
      'A company with the same unique value already exists',
    );
    return true;
  }

  if (error instanceof RepositoryConstraintError && operation === 'delete') {
    sendApiError(
      res,
      409,
      'COMPANY_DELETE_CONFLICT',
      'Company cannot be deleted while related assessments exist',
    );
    return true;
  }

  if (error instanceof RepositoryStateError && operation === 'archive') {
    sendApiError(
      res,
      409,
      'COMPANY_ALREADY_ARCHIVED',
      'Company is already archived',
    );
    return true;
  }

  if (error instanceof RepositoryStateError && operation === 'restore') {
    sendApiError(res, 409, 'COMPANY_NOT_ARCHIVED', 'Company is not archived');
    return true;
  }

  if (error instanceof RepositoryError) {
    console.error('Unexpected company repository error', error);
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
