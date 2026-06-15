import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type { Company } from '../../src/domain/company.js';
import {
  companyRouteParamsSchema,
  createCompanyRequestSchema,
  updateCompanyRequestSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import {
  RepositoryConflictError,
  RepositoryConstraintError,
  RepositoryError,
  RepositoryNotFoundError,
} from '../database/errors.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';

const companyResponse = (company: Company): Company => ({ ...company });

const sendCompanyResponse = (
  res: Response,
  statusCode: number,
  company: Company,
): Response =>
  res.status(statusCode).json({
    data: companyResponse(company),
  });

type CompanyRepositoryOperation =
  | 'list'
  | 'retrieve'
  | 'overview'
  | 'create'
  | 'update'
  | 'delete';

const handleCompanyRepositoryError = (
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

  if (error instanceof RepositoryError) {
    console.error('Unexpected company repository error', error);
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

export const createCompaniesRouter = (
  companyRepository: CompanyRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    asyncRoute(async (_req, res) => {
      try {
        const companies = await companyRepository.findAll();

        res.status(200).json({
          data: companies.map(companyResponse),
        });
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'list')) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id/overview',
    createRequestValidationMiddleware({
      params: companyRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const overview = await companyRepository.findOverview(id);

        if (!overview) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        res.status(200).json({ data: overview });
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'overview')) {
          throw error;
        }
      }
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: companyRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        const company = await companyRepository.findById(id);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        sendCompanyResponse(res, 200, company);
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createCompanyRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const body = res.locals.validatedRequest?.body as {
        name: string;
        description?: string;
        website?: string;
        contactName?: string;
        contactEmail?: string;
        logoPath?: string;
        footerText?: string;
      };

      try {
        const company = await companyRepository.create(body);
        const response = res.location(`/api/companies/${company.id}`);

        sendCompanyResponse(response, 201, company);
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'create')) {
          throw error;
        }
      }
    }),
  );

  router.patch(
    '/:id',
    createRequestValidationMiddleware({
      params: companyRouteParamsSchema,
      body: updateCompanyRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };
      const body = res.locals.validatedRequest?.body as {
        name?: string;
        description?: string;
        website?: string;
        contactName?: string;
        contactEmail?: string;
        logoPath?: string;
        footerText?: string;
      };

      try {
        const updatedCompany = await companyRepository.update(id, {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.website !== undefined ? { website: body.website } : {}),
          ...(body.contactName !== undefined
            ? { contactName: body.contactName }
            : {}),
          ...(body.contactEmail !== undefined
            ? { contactEmail: body.contactEmail }
            : {}),
          ...(body.logoPath !== undefined ? { logoPath: body.logoPath } : {}),
          ...(body.footerText !== undefined
            ? { footerText: body.footerText }
            : {}),
        });

        sendCompanyResponse(res, 200, updatedCompany);
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'update')) {
          throw error;
        }
      }
    }),
  );

  router.delete(
    '/:id',
    createRequestValidationMiddleware({
      params: companyRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        await companyRepository.delete(id);
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
