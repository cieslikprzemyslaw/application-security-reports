import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import type {
  ReportView,
  ReportViewEvidence,
} from '../../src/domain/report-view.js';
import type {
  CreateReportRequest,
  ReportSnapshot,
} from '../../src/domain/report.js';
import {
  assessmentReportListResponseSchema,
  createReportRequestSchema,
  reportListQuerySchema,
  reportRouteParamsSchema,
  reportViewSchema,
} from '../../src/domain/schemas/index.js';
import { sendApiError } from '../http/api-errors.js';
import { createRequestValidationMiddleware } from '../http/request-validation.js';
import { RepositoryError } from '../database/errors.js';
import type { AssessmentRepository } from '../database/repositories/assessment.repository.js';
import type { CompanyRepository } from '../database/repositories/company.repository.js';
import type { EvidenceRepository } from '../database/repositories/evidence.repository.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import type { SettingsRepository } from '../database/repositories/settings.repository.js';
import type { ThreatRepository } from '../database/repositories/threat.repository.js';
import type { Evidence } from '../../src/domain/evidence.js';
import { createReportRouteHandler } from './reports.create.route.js';

type ReportRepositoryOperation = 'list' | 'retrieve';

const asyncRoute =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

const sendReportViewResponse = (
  res: Response,
  statusCode: number,
  reportView: ReportView,
): Response => {
  const parsedReportView = reportViewSchema.parse(reportView);

  return res.status(statusCode).json({
    data: parsedReportView,
  });
};

const handleReportRepositoryError = (
  error: unknown,
  res: Response,
  _operation: ReportRepositoryOperation,
): boolean => {
  if (error instanceof RepositoryError) {
    console.error('Unexpected report repository error', error);
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error');
    return true;
  }

  return false;
};

const toEvidenceView = (evidence: Evidence): ReportViewEvidence => ({
  id: evidence.id,
  assessmentId: evidence.assessmentId,
  threatIds: [...evidence.threatIds],
  type: evidence.type,
  title: evidence.title,
  description: evidence.description,
  content: evidence.content,
  fileName: evidence.fileName,
  mimeType: evidence.mimeType,
  capturedAt: evidence.capturedAt,
  createdAt: evidence.createdAt,
  updatedAt: evidence.updatedAt,
});

const sortEvidence = <
  T extends { capturedAt?: string; createdAt: string; id: string },
>(
  evidence: T[],
): T[] =>
  [...evidence].sort((left, right) => {
    const leftTime = new Date(left.capturedAt ?? left.createdAt).getTime();
    const rightTime = new Date(right.capturedAt ?? right.createdAt).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });

export const createReportsRouter = (
  reportRepository: ReportRepository,
  assessmentRepository: AssessmentRepository,
  companyRepository: CompanyRepository,
  threatRepository: ThreatRepository,
  evidenceRepository: EvidenceRepository,
  settingsRepository: SettingsRepository,
): Router => {
  const router = Router();

  router.get(
    '/',
    createRequestValidationMiddleware({
      query: reportListQuerySchema,
    }),
    asyncRoute(async (_req, res) => {
      const { assessmentId } = res.locals.validatedRequest?.query as {
        assessmentId: string;
      };

      try {
        const assessment = await assessmentRepository.findById(assessmentId);

        if (!assessment) {
          sendApiError(
            res,
            404,
            'ASSESSMENT_NOT_FOUND',
            'Assessment not found',
          );
          return;
        }

        const reports = await reportRepository.findByAssessmentId(assessmentId);
        const parsedReports = assessmentReportListResponseSchema.parse(reports);

        res.status(200).json({ data: parsedReports });
      } catch (error) {
        if (!handleReportRepositoryError(error, res, 'list')) {
          throw error;
        }
      }
    }),
  );

  router.post(
    '/',
    createRequestValidationMiddleware({
      body: createReportRequestSchema,
    }),
    asyncRoute(async (_req, res) => {
      await createReportRouteHandler(
        res.locals.validatedRequest?.body as CreateReportRequest,
        res,
        {
          reportRepository,
          assessmentRepository,
          threatRepository,
        },
      );
    }),
  );

  router.get(
    '/:id',
    createRequestValidationMiddleware({
      params: reportRouteParamsSchema,
    }),
    asyncRoute(async (_req, res) => {
      const { id } = res.locals.validatedRequest?.params as {
        id: string;
      };

      try {
        const report = await reportRepository.findById(id);

        if (!report) {
          sendApiError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
          return;
        }

        const [assessment, settings] = await Promise.all([
          assessmentRepository.findById(report.assessmentId),
          settingsRepository.get(),
        ]);

        if (!assessment) {
          sendApiError(
            res,
            400,
            'REPORT_INVALID_RELATIONSHIP',
            'Report contains invalid related records',
          );
          return;
        }

        const company = await companyRepository.findById(assessment.companyId);

        if (!company) {
          sendApiError(
            res,
            400,
            'REPORT_INVALID_RELATIONSHIP',
            'Report contains invalid related records',
          );
          return;
        }

        if (!settings) {
          sendApiError(res, 404, 'SETTINGS_NOT_FOUND', 'Settings not found');
          return;
        }

        const [threats, evidence] = await Promise.all([
          threatRepository.findByAssessmentId(report.assessmentId),
          evidenceRepository.findByAssessmentId(report.assessmentId),
        ]);

        const threatsById = new Map(threats.map(threat => [threat.id, threat]));
        const threatIdsInAssessment = new Set(threatsById.keys());
        const selectedThreatIds = report.selectedThreatIds;

        const selectedThreats = selectedThreatIds.map(threatId =>
          threatsById.get(threatId),
        );

        if (selectedThreats.some(threat => !threat)) {
          sendApiError(
            res,
            400,
            'REPORT_INVALID_RELATIONSHIP',
            'Report contains invalid related records',
          );
          return;
        }

        if (
          selectedThreats.some(threat => threat?.assessmentId !== assessment.id)
        ) {
          sendApiError(
            res,
            400,
            'REPORT_INVALID_RELATIONSHIP',
            'Report contains invalid related records',
          );
          return;
        }

        const selectedThreatIdSet = new Set(selectedThreatIds);
        const evidenceByThreatId = new Map(
          selectedThreatIds.map(threatId => [
            threatId,
            [] as ReturnType<typeof toEvidenceView>[],
          ]),
        );

        for (const evidenceItem of evidence) {
          if (evidenceItem.assessmentId !== assessment.id) {
            sendApiError(
              res,
              400,
              'REPORT_INVALID_RELATIONSHIP',
              'Report contains invalid related records',
            );
            return;
          }

          if (
            evidenceItem.threatIds.some(
              threatId => !threatIdsInAssessment.has(threatId),
            )
          ) {
            sendApiError(
              res,
              400,
              'REPORT_INVALID_RELATIONSHIP',
              'Report contains invalid related records',
            );
            return;
          }

          const matchingThreatIds = evidenceItem.threatIds.filter(threatId =>
            selectedThreatIdSet.has(threatId),
          );

          if (matchingThreatIds.length === 0) {
            continue;
          }

          const evidenceView = toEvidenceView(evidenceItem);

          for (const threatId of matchingThreatIds) {
            evidenceByThreatId.get(threatId)?.push(evidenceView);
          }
        }

        const snapshot: ReportSnapshot = {
          reportTitle: report.title,
          companyName: company.name,
          assessmentTitle: assessment.title,
          executiveSummary: report.executiveSummary,
          branding: {
            brandingMode: settings.defaultBrandingMode,
            issuerName: settings.organisationName,
            issuerContactName: settings.consultantName,
            issuerContactEmail: settings.consultantEmail,
            issuerLogoId: settings.issuerLogoId,
            clientName: company.name,
            clientWebsite: company.website,
            clientContactEmail: company.contactEmail,
            clientFooterText: company.footerText,
            reportFooterText: settings.reportFooterText,
            confidentialityLabel: settings.reportConfidentialityLabel,
            confidentialReports: settings.confidentialReports,
          },
          threats: selectedThreatIds.map(threatId => {
            const threat = threatsById.get(threatId);

            if (!threat) {
              throw new Error(
                'Validated report threat missing during snapshot assembly.',
              );
            }

            return {
              threatId: threat.id,
              title: threat.title,
              description: threat.description,
              severity: threat.severity,
              status: threat.status,
              strideCategories: [...threat.strideCategories],
              affectedAsset: threat.affectedAsset,
              impact: threat.impact,
              recommendation: threat.recommendation,
            };
          }),
        };

        const reportView: ReportView = {
          report,
          company,
          assessments: [
            {
              assessment,
              findings: selectedThreatIds.map(threatId => {
                const threat = threatsById.get(threatId);

                if (!threat) {
                  throw new Error(
                    'Validated report threat missing during view assembly.',
                  );
                }

                return {
                  threat,
                  evidence: sortEvidence(
                    evidenceByThreatId.get(threatId) ?? [],
                  ),
                };
              }),
            },
          ],
          branding: {
            companyName: company.name,
            companyWebsite: company.website,
            companyContactEmail: company.contactEmail,
            companyLogoUrl: company.logoUrl ?? null,
            companyFooterText: company.footerText,
            issuerName: settings.organisationName,
            issuerContactName: settings.consultantName,
            issuerContactEmail: settings.consultantEmail,
            issuerLogoId: settings.issuerLogoId,
            reportFooterText: settings.reportFooterText,
            reportConfidentialityLabel: settings.reportConfidentialityLabel,
            confidentialReports: settings.confidentialReports,
            allowedBrandingModes: settings.allowedBrandingModes,
            defaultBrandingMode: settings.defaultBrandingMode,
          },
          configuration: {
            methodology: settings.methodology,
            reportStyle: settings.reportStyle,
            includeEvidence: settings.includeEvidence,
          },
          snapshot,
        };

        sendReportViewResponse(res, 200, reportView);
      } catch (error) {
        if (!handleReportRepositoryError(error, res, 'retrieve')) {
          throw error;
        }
      }
    }),
  );

  return router;
};
