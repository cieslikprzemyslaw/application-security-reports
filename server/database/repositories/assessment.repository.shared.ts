import type { Assessment } from '../../../src/domain/assessment.js';
import { isCweCatalogVersion } from '../../../src/domain/cwe.js';
import { isOwaspTop10Version } from '../../../src/domain/owaspTop10.js';
import { RepositoryError } from '../errors.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface AssessmentListRecord extends Assessment {
  findingsCount: number;
}

export type AssessmentRow = {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  scope: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  applicationName: string | null;
  environment: string | null;
  assessmentType: string | null;
  overallRisk: string | null;
  owaspTaxonomyVersion: string;
  cweCatalogVersion: string;
  archivedAt: Date | null;
  archivedFromStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssessmentListRow = AssessmentRow & {
  _count: {
    threats: number;
  };
};

export const assessmentSelect = {
  id: true,
  companyId: true,
  title: true,
  description: true,
  scope: true,
  status: true,
  startedAt: true,
  completedAt: true,
  applicationName: true,
  environment: true,
  assessmentType: true,
  overallRisk: true,
  owaspTaxonomyVersion: true,
  cweCatalogVersion: true,
  archivedAt: true,
  archivedFromStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const assessmentListSelect = {
  ...assessmentSelect,
  _count: {
    select: { threats: true },
  },
} as const;

export const toAssessment = (row: AssessmentRow): Assessment => ({
  id: row.id,
  companyId: row.companyId,
  title: row.title,
  description: toOptionalText(row.description),
  scope: toOptionalText(row.scope),
  status: row.status as Assessment['status'],
  startedAt: toOptionalText(row.startedAt) as Assessment['startedAt'],
  completedAt: toOptionalText(row.completedAt) as Assessment['completedAt'],
  applicationName: row.applicationName,
  environment: toOptionalText(row.environment),
  assessmentType: toOptionalText(row.assessmentType),
  overallRisk: toOptionalText(row.overallRisk) as Assessment['overallRisk'],
  owaspTaxonomyVersion: isOwaspTop10Version(row.owaspTaxonomyVersion)
    ? row.owaspTaxonomyVersion
    : (() => {
        throw new RepositoryError(
          `Unsupported OWASP taxonomy version: ${row.owaspTaxonomyVersion}`,
        );
      })(),
  cweCatalogVersion: isCweCatalogVersion(row.cweCatalogVersion)
    ? row.cweCatalogVersion
    : (() => {
        throw new RepositoryError(
          `Unsupported CWE catalog version: ${row.cweCatalogVersion}`,
        );
      })(),
  archivedAt: row.archivedAt ? toIsoString(row.archivedAt) : null,
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

export const toAssessmentListRecord = (
  row: AssessmentListRow,
): AssessmentListRecord => ({
  ...toAssessment(row),
  findingsCount: row._count.threats,
});
