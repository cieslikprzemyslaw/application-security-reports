import type {
  ReportReadinessErrorItem,
  ReportReadinessItem,
  ReportReadinessResult,
  ReportReadinessWarningItem,
} from '../../src/domain/report-readiness.js';
import type {
  ReportPreviewRequest,
  ReportPreviewSnapshot,
} from '../../src/domain/report-preview.js';
import type { Report } from '../../src/domain/report.js';
import { reportReadinessResultSchema } from '../../src/domain/schemas/report-readiness.schema.js';
import {
  ValidationError,
  type ValidationFieldError,
} from '../../src/validation/index.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import type { ReportRepository } from '../database/repositories/report.repository.js';
import {
  generateReportPreviewSnapshot,
  type ReportPreviewGenerationRepositories,
} from './report-preview-generation.service.js';

export interface ClassifyReportReadinessInput {
  report: Report;
  snapshot: ReportPreviewSnapshot;
}

export interface ResolveReportReadinessInput {
  reportId: string;
  request: ReportPreviewRequest;
  baseUrl: string;
}

export interface ResolveReportReadinessDependencies extends ReportPreviewGenerationRepositories {
  reportRepository: Pick<ReportRepository, 'findById'>;
}

export interface ResolvedReportReadiness {
  report: Report;
  snapshot: ReportPreviewSnapshot;
  readiness: ReportReadinessResult;
}

export class ReportReadinessReportNotFoundError extends RepositoryNotFoundError {
  constructor() {
    super('Report not found.');
    this.name = 'ReportReadinessReportNotFoundError';
  }
}

const hasText = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const reportTarget = (
  reportId: string,
  field: string,
): ReportReadinessItem['target'] => ({
  resourceType: 'report',
  resourceId: reportId,
  field,
});

const threatTarget = (
  threatId: string,
  field: string,
): ReportReadinessItem['target'] => ({
  resourceType: 'threat',
  resourceId: threatId,
  field,
});

const requireActiveReport = (report: Report): void => {
  if (report.status !== 'archived') {
    return;
  }

  throw new ValidationError({
    error: 'VALIDATION_ERROR',
    fields: [
      {
        path: 'status',
        message: 'Archived Reports are not eligible for readiness validation.',
        code: 'custom',
      },
    ],
  });
};
const requireReportAssessment = (
  reportAssessmentId: string,
  requestAssessmentId: string,
): void => {
  if (reportAssessmentId === requestAssessmentId) {
    return;
  }

  const fields: ValidationFieldError[] = [
    {
      path: 'assessmentId',
      message: 'Assessment does not belong to the requested Report.',
      code: 'custom',
    },
  ];

  throw new ValidationError({
    error: 'VALIDATION_ERROR',
    fields,
  });
};

export const classifyReportReadiness = ({
  report,
  snapshot,
}: ClassifyReportReadinessInput): ReportReadinessResult => {
  const errors: ReportReadinessErrorItem[] = [];
  const warnings: ReportReadinessWarningItem[] = [];

  if (!hasText(report.title)) {
    errors.push({
      code: 'REPORT_TITLE_REQUIRED',
      message: 'A report title is required before finalisation.',
      target: reportTarget(report.id, 'title'),
    });
  }

  if (snapshot.selectedThreats.length === 0) {
    errors.push({
      code: 'THREAT_SELECTION_REQUIRED',
      message: 'At least one Threat must be selected before finalisation.',
      target: reportTarget(report.id, 'selection.threatIds'),
    });
  }

  for (const threat of snapshot.selectedThreats) {
    if (!hasText(threat.description)) {
      errors.push({
        code: 'THREAT_DESCRIPTION_REQUIRED',
        message: 'A Threat description is required before finalisation.',
        target: threatTarget(threat.id, 'description'),
      });
    }

    if (!hasText(threat.impact)) {
      errors.push({
        code: 'THREAT_IMPACT_REQUIRED',
        message: 'Threat impact is required before finalisation.',
        target: threatTarget(threat.id, 'impact'),
      });
    }

    if (!hasText(threat.recommendation)) {
      errors.push({
        code: 'THREAT_RECOMMENDATION_REQUIRED',
        message: 'A Threat recommendation is required before finalisation.',
        target: threatTarget(threat.id, 'recommendation'),
      });
    }
  }

  if (
    snapshot.branding.brandingMode === 'issuer' &&
    !hasText(snapshot.branding.issuerName)
  ) {
    errors.push({
      code: 'ISSUER_NAME_REQUIRED',
      message: 'Issuer name is required when issuer branding is selected.',
      target: reportTarget(report.id, 'brandingMode'),
    });
  }

  if (snapshot.configuration.includeEvidence !== false) {
    if (snapshot.selectedEvidence.length === 0) {
      warnings.push({
        code: 'EVIDENCE_SELECTION_EMPTY',
        message: 'No Evidence is selected for inclusion in the report.',
        target: reportTarget(report.id, 'selection.evidenceIds'),
      });
    }

    for (const threat of snapshot.selectedThreats) {
      const hasSelectedEvidence = snapshot.selectedEvidence.some(evidence =>
        evidence.threatIds.includes(threat.id),
      );

      if (!hasSelectedEvidence) {
        warnings.push({
          code: 'THREAT_EVIDENCE_MISSING',
          message: 'This Threat has no selected Evidence.',
          target: threatTarget(threat.id, 'evidence'),
        });
      }
    }
  }

  return reportReadinessResultSchema.parse({ errors, warnings });
};

export const resolveReportReadinessSnapshot = async (
  input: ResolveReportReadinessInput,
  dependencies: ResolveReportReadinessDependencies,
): Promise<ResolvedReportReadiness> => {
  const report = await dependencies.reportRepository.findById(input.reportId);

  if (!report) {
    throw new ReportReadinessReportNotFoundError();
  }

  requireActiveReport(report);

  requireReportAssessment(report.assessmentId, input.request.assessmentId);

  const snapshot = await generateReportPreviewSnapshot(
    input.request,
    dependencies,
    input.baseUrl,
  );

  return {
    report,
    snapshot,
    readiness: classifyReportReadiness({ report, snapshot }),
  };
};

export const resolveReportReadiness = async (
  input: ResolveReportReadinessInput,
  dependencies: ResolveReportReadinessDependencies,
): Promise<ReportReadinessResult> =>
  (await resolveReportReadinessSnapshot(input, dependencies)).readiness;
