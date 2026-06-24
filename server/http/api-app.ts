import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import type { Router } from 'express';

import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { ReportVersionRepository } from '../database/repositories/reportVersion.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import type { ServerConfig } from '../config.js';
import type { CompanyLogoStorage } from '../services/companyLogoStorage.js';
import type { IssuerLogoStorage } from '../services/issuerLogoStorage.js';
import { sendApiError } from './api-errors.js';
import { createApiRouter } from './api-router.js';
import { createEvidenceStaticRouter } from './evidence-static.js';
import { apiErrorHandler, apiNotFoundHandler } from './error-handler.js';

export interface ApiAppOptions {
  assessmentRepository?: AssessmentRepository;
  companyRepository?: CompanyRepository;
  evidenceRepository?: EvidenceRepository;
  logoStorage?: CompanyLogoStorage;
  issuerLogoStorage?: IssuerLogoStorage;
  reportRepository?: ReportRepository;
  reportVersionRepository?: ReportVersionRepository;
  settingsRepository?: SettingsRepository;
  threatRepository?: ThreatRepository;
  registerRoutes?: (router: Router) => void;
}

const jsonBodyLimit = '1mb';
const allowedCorsMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const allowedCorsHeaders = ['Content-Type', 'X-File-Name'];
const companyLogoUploadPath = /^\/api\/companies\/[^/]+\/logo$/;
const issuerLogoUploadPath = /^\/api\/settings\/issuer-logo$/;
const logoUploadMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const applySecurityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
};

const requireJsonMutationContentType: RequestHandler = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  if (!req.path.startsWith('/api/')) {
    next();
    return;
  }

  if (
    req.method === 'PUT' &&
    (companyLogoUploadPath.test(req.path) ||
      issuerLogoUploadPath.test(req.path))
  ) {
    if (logoUploadMimeTypes.some(type => req.is(type))) {
      next();
      return;
    }

    if (issuerLogoUploadPath.test(req.path)) {
      sendApiError(
        res,
        422,
        'LOGO_VALIDATION_ERROR',
        'Issuer logo file type is not supported',
      );
      return;
    }

    sendApiError(
      res,
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be image/jpeg, image/png, or image/webp',
    );
    return;
  }

  if (req.is('application/json')) {
    next();
    return;
  }

  sendApiError(
    res,
    415,
    'UNSUPPORTED_MEDIA_TYPE',
    'Content-Type must be application/json',
  );
};

export const createApiApp = (
  config: ServerConfig,
  options: ApiAppOptions = {},
): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(applySecurityHeaders);
  app.use(
    cors({
      origin(requestOrigin, callback) {
        if (!requestOrigin || requestOrigin === config.frontendOrigin) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      methods: allowedCorsMethods,
      allowedHeaders: allowedCorsHeaders,
      credentials: false,
    }),
  );
  app.use(requireJsonMutationContentType);
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use('/uploads/evidence', createEvidenceStaticRouter());
  app.use('/api', createApiRouter(options));
  app.use(apiNotFoundHandler);
  app.use(apiErrorHandler);

  return app;
};
