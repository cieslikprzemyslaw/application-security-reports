import { Router } from 'express';

import {
  companyRouteParamsSchema,
  createCompanyRequestSchema,
  updateCompanyRequestSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import { createCompanyAssessmentOverviewRouter } from './companies.assessment-overview.route.js';
import { createCompanyLogoRouter } from './companies.logo.route.js';
import {
  asyncRoute,
  buildBaseUrl,
  companyResponse,
  handleCompanyRepositoryError,
  sendCompanyResponse,
} from './companies.route.shared.js';
import type {
  CompaniesRouteDependencies,
  CreateCompanyBody,
  UpdateCompanyBody,
} from './companies.route.types.js';

export const createCompaniesRouter = (
  companyRepository: CompanyRepository,
  dependencies: CompaniesRouteDependencies = {},
): Router => {
  const router = Router();

  router.get(
    '/',
    asyncRoute(async (req, res) => {
      try {
        const companies = await companyRepository.findAll();
        const baseUrl = buildBaseUrl(req);

        res.status(200).json({
          data: companies.map(c => companyResponse(c, baseUrl)),
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
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const overview = await companyRepository.findOverview(id);

        if (!overview) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        const baseUrl = buildBaseUrl(req);

        res.status(200).json({
          data: {
            ...overview,
            company: companyResponse(overview.company, baseUrl),
          },
        });
      } catch (error) {
        if (!handleCompanyRepositoryError(error, res, 'overview')) {
          throw error;
        }
      }
    }),
  );

  if (
    dependencies.assessmentRepository &&
    dependencies.threatRepository &&
    dependencies.evidenceRepository &&
    dependencies.reportRepository
  ) {
    router.use(
      createCompanyAssessmentOverviewRouter(
        companyRepository,
        dependencies.assessmentRepository,
        dependencies.threatRepository,
        dependencies.evidenceRepository,
        dependencies.reportRepository,
      ),
    );
  }

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: companyRouteParamsSchema,
    }),
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };

      try {
        const company = await companyRepository.findById(id);

        if (!company) {
          sendApiError(res, 404, 'COMPANY_NOT_FOUND', 'Company not found');
          return;
        }

        sendCompanyResponse(req, res, 200, company);
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
    asyncRoute(async (req, res) => {
      const body = res.locals.validatedRequest?.body as CreateCompanyBody;

      try {
        const company = await companyRepository.create(body);
        const response = res.location('/api/companies/' + company.id);

        sendCompanyResponse(req, response, 201, company);
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
    asyncRoute(async (req, res) => {
      const { id } = res.locals.validatedRequest?.params as { id: string };
      const body = res.locals.validatedRequest?.body as UpdateCompanyBody;

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
          ...(body.footerText !== undefined
            ? { footerText: body.footerText }
            : {}),
        });

        sendCompanyResponse(req, res, 200, updatedCompany);
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
      const { id } = res.locals.validatedRequest?.params as { id: string };

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

  router.use(
    createCompanyLogoRouter(companyRepository, dependencies.logoStorage),
  );

  return router;
};
