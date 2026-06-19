import type { AssessmentWorkspaceOverview } from '~/services/assessmentService';
import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_REGISTRY,
  type Threat,
} from '~/domain';
import type {
  ThreatCreateInput,
  ThreatUpdateInput,
} from '~/services/threatService';

import type { AssessmentDetailsAssessment } from './assessmentDetails.type';
import type { ThreatFormValue } from '~/app/components/appsec/threatForm';
import type { ThreatTableRow } from '~/app/components/appsec/threatTable';

const normalizeOptionalText = (value?: string) => {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const defaultOwaspCategoryCode =
  OWASP_TOP_10_REGISTRY[OWASP_TOP_10_CURRENT_VERSION].categories.A01.value;

export const createEmptyThreatFormValue = (): ThreatFormValue => ({
  title: '',
  owaspCategoryCode: defaultOwaspCategoryCode,
  customCategory: '',
  strideCategory: 'spoofing',
  severity: 'medium',
  status: 'draft',
  affectedComponent: '',
  affectedEndpoint: '',
  observation: '',
  reproductionSteps: '',
  risk: '',
  recommendation: '',
  references: '',
  resolutionNote: '',
  acceptedRiskJustification: '',
});

export const toAssessmentViewModel = (
  overview: AssessmentWorkspaceOverview,
): AssessmentDetailsAssessment => ({
  ...overview.assessment,
  companyName: overview.company.name,
  applicationName:
    overview.assessment.applicationName?.trim() ||
    overview.assessment.title?.trim() ||
    'Untitled assessment',
});

export const threatToFormValue = (threat: Threat): ThreatFormValue => ({
  title: threat.title,
  owaspCategoryCode:
    threat.owaspCategoryCode ??
    (threat.customCategory ? 'custom' : defaultOwaspCategoryCode),
  customCategory:
    threat.owaspCategoryCode === 'custom' ? (threat.customCategory ?? '') : '',
  strideCategory: threat.strideCategories[0] ?? 'spoofing',
  severity: threat.severity,
  status: threat.status,
  affectedComponent: threat.affectedComponent ?? '',
  affectedEndpoint: threat.affectedEndpoint ?? threat.affectedAsset ?? '',
  observation:
    threat.reproductionSteps ?? threat.observation ?? threat.description ?? '',
  reproductionSteps:
    threat.reproductionSteps ?? threat.observation ?? threat.description ?? '',
  risk: threat.risk ?? threat.impact ?? '',
  recommendation: threat.remediation ?? threat.recommendation ?? '',
  references: threat.references ?? '',
  resolutionNote: threat.resolutionNote ?? '',
  acceptedRiskJustification: threat.acceptedRiskJustification ?? '',
});

const threatFormValueToPayload = (
  value: ThreatFormValue,
): Omit<ThreatCreateInput, 'assessmentId'> => ({
  title: value.title.trim(),
  severity: value.severity,
  status: value.status,
  strideCategories: value.strideCategory
    ? [value.strideCategory]
    : ['spoofing'],
  owaspCategoryCode: normalizeOptionalText(value.owaspCategoryCode),
  customCategory:
    value.owaspCategoryCode === 'custom'
      ? normalizeOptionalText(value.customCategory)
      : undefined,
  affectedComponent: normalizeOptionalText(value.affectedComponent),
  affectedEndpoint: normalizeOptionalText(value.affectedEndpoint),
  description:
    normalizeOptionalText(value.observation) ?? value.observation.trim(),
  observation: normalizeOptionalText(value.observation),
  reproductionSteps: normalizeOptionalText(
    value.reproductionSteps ?? value.observation,
  ),
  risk: normalizeOptionalText(value.risk),
  recommendation: normalizeOptionalText(value.recommendation),
  remediation: normalizeOptionalText(value.recommendation),
  references: normalizeOptionalText(value.references),
  resolutionNote: normalizeOptionalText(value.resolutionNote),
  acceptedRiskJustification: normalizeOptionalText(
    value.acceptedRiskJustification,
  ),
});

export const threatFormValueToCreateInput = (
  assessmentId: string,
  value: ThreatFormValue,
): ThreatCreateInput => ({
  assessmentId,
  ...threatFormValueToPayload(value),
});

export const threatFormValueToUpdateInput = (
  value: ThreatFormValue,
): ThreatUpdateInput => threatFormValueToPayload(value);

export const threatToTableRow = (threat: Threat): ThreatTableRow => ({
  id: threat.id,
  title: threat.title,
  owaspCategoryCode: threat.owaspCategoryCode,
  customCategory: threat.customCategory,
  severity: threat.severity,
  status: threat.status,
  evidenceCount: threat.evidenceCount,
  updatedAt: threat.updatedAt,
  affectedComponent: threat.affectedComponent,
  affectedEndpoint: threat.affectedEndpoint ?? threat.affectedAsset,
  impact: threat.impact ?? threat.risk,
  recommendation: threat.recommendation ?? threat.remediation,
  observation: threat.observation,
  reproductionSteps: threat.reproductionSteps ?? threat.observation,
  references: threat.references,
  resolutionNote: threat.resolutionNote,
  acceptedRiskJustification: threat.acceptedRiskJustification,
});
