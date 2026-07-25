import type { Threat } from '../../../src/domain/threat.js';

import { toIsoString, toOptionalText } from './repository.helpers.js';
import {
  parseAssessmentCweCatalogVersion,
  toThreatCweMappings,
  type AssessmentThreatTaxonomyRow,
  type ThreatCweRow,
} from './threat-cwe.repository.js';

export type ThreatRow = {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  severity: string;
  strideCategories: unknown;
  status: string;
  owaspCategoryCode: string | null;
  customCategory: string | null;
  affectedAsset: string | null;
  impact: string | null;
  recommendation: string | null;
  remediation: string | null;
  observation: string | null;
  reproductionSteps: string | null;
  affectedComponent: string | null;
  affectedEndpoint: string | null;
  risk: string | null;
  references: string | null;
  createdAt: Date;
  updatedAt: Date;
  assessment: AssessmentThreatTaxonomyRow;
  cweMappings: ThreatCweRow[];
};

export const threatSelect = {
  id: true,
  assessmentId: true,
  title: true,
  description: true,
  severity: true,
  strideCategories: true,
  status: true,
  owaspCategoryCode: true,
  customCategory: true,
  affectedAsset: true,
  impact: true,
  recommendation: true,
  remediation: true,
  observation: true,
  reproductionSteps: true,
  affectedComponent: true,
  affectedEndpoint: true,
  risk: true,
  references: true,
  createdAt: true,
  updatedAt: true,
  assessment: {
    select: {
      owaspTaxonomyVersion: true,
      cweCatalogVersion: true,
    },
  },
  cweMappings: {
    select: { cweId: true, position: true },
    orderBy: [{ position: 'asc' as const }, { cweId: 'asc' as const }],
  },
} as const;

const normalizeCustomCategoryForRead = (
  code?: string | null,
  custom?: string | null,
) => (code === 'custom' ? toOptionalText(custom) : undefined);

export const toThreat = (row: ThreatRow): Threat => {
  const cweCatalogVersion = parseAssessmentCweCatalogVersion(row.assessment);

  return {
    id: row.id,
    assessmentId: row.assessmentId,
    title: row.title,
    description: row.description,
    severity: row.severity as Threat['severity'],
    strideCategories: Array.isArray(row.strideCategories)
      ? (row.strideCategories as Threat['strideCategories'])
      : [],
    status: row.status as Threat['status'],
    cweCatalogVersion,
    cweMappings: toThreatCweMappings(row.cweMappings, cweCatalogVersion),
    owaspCategoryCode: toOptionalText(row.owaspCategoryCode),
    customCategory: normalizeCustomCategoryForRead(
      row.owaspCategoryCode,
      row.customCategory,
    ),
    affectedAsset: toOptionalText(row.affectedAsset),
    impact: toOptionalText(row.impact),
    recommendation: toOptionalText(row.recommendation),
    remediation: toOptionalText(row.remediation),
    observation: toOptionalText(row.observation),
    reproductionSteps: toOptionalText(row.reproductionSteps),
    affectedComponent: toOptionalText(row.affectedComponent),
    affectedEndpoint: toOptionalText(row.affectedEndpoint),
    risk: toOptionalText(row.risk),
    references: toOptionalText(row.references),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
};
