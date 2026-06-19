import type { Assessment } from '../../../src/domain/assessment.js';
import type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../../../src/domain/assessment.js';
import {
  OWASP_TOP_10_CURRENT_VERSION,
  isOwaspTop10Version,
} from '../../../src/domain/owaspTop10.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface AssessmentRepository {
  findAll(): Promise<Assessment[]>;
  findById(id: string): Promise<Assessment | null>;
  findByCompanyId(companyId: string): Promise<Assessment[]>;
  create(input: CreateAssessmentInput): Promise<Assessment>;
  update(id: string, input: UpdateAssessmentInput): Promise<Assessment>;
  delete(id: string): Promise<void>;
}

type AssessmentRepositoryDb = Pick<RepositoryClient, 'assessment'>;

type AssessmentRow = {
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
  createdAt: Date;
  updatedAt: Date;
};

const assessmentSelect = {
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
  createdAt: true,
  updatedAt: true,
} as const;

const toAssessment = (row: AssessmentRow): Assessment => ({
  id: row.id,
  companyId: row.companyId,
  title: row.title,
  description: toOptionalText(row.description),
  scope: toOptionalText(row.scope),
  status: row.status as Assessment['status'],
  startedAt: toOptionalText(row.startedAt) as Assessment['startedAt'],
  completedAt: toOptionalText(row.completedAt) as Assessment['completedAt'],
  applicationName: toOptionalText(row.applicationName),
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
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

export function createAssessmentRepository(
  db: AssessmentRepositoryDb,
): AssessmentRepository {
  return {
    async findAll() {
      const assessments = await db.assessment.findMany({
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: assessmentSelect,
      });

      return assessments.map(toAssessment);
    },

    async findById(id) {
      const assessment = await db.assessment.findUnique({
        where: { id },
        select: assessmentSelect,
      });

      return assessment ? toAssessment(assessment) : null;
    },

    async findByCompanyId(companyId) {
      const assessments = await db.assessment.findMany({
        where: { companyId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: assessmentSelect,
      });

      return assessments.map(toAssessment);
    },

    async create(input) {
      try {
        const assessment = await db.assessment.create({
          data: {
            id: generateId('assessment'),
            companyId: input.companyId,
            title: input.title,
            description: input.description,
            scope: input.scope,
            status: input.status,
            startedAt: input.startedAt,
            completedAt: input.completedAt,
            applicationName: input.applicationName,
            environment: input.environment,
            assessmentType: input.assessmentType,
            overallRisk: input.overallRisk,
            owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
          },
          select: assessmentSelect,
        });

        return toAssessment(assessment);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        const assessment = await db.assessment.update({
          where: { id },
          data: input,
          select: assessmentSelect,
        });

        return toAssessment(assessment);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await db.assessment.delete({ where: { id } });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
