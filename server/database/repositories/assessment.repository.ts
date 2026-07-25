import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../../../src/domain/assessment.js';
import { CWE_CATALOG_CURRENT_VERSION } from '../../../src/domain/cwe.js';
import { OWASP_TOP_10_CURRENT_VERSION } from '../../../src/domain/owaspTop10.js';
import { generateId } from '../../utils/id.js';
import {
  mapPrismaError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import {
  createAssessmentLifecycleOperations,
  type AssessmentLifecycleDb,
  type AssessmentLifecycleOperations,
} from './assessment-lifecycle.repository.js';
import {
  assessmentListSelect,
  assessmentSelect,
  toAssessment,
  toAssessmentListRecord,
} from './assessment.repository.shared.js';

export type { AssessmentListRecord } from './assessment.repository.shared.js';

export interface AssessmentRepository extends Partial<AssessmentLifecycleOperations> {
  findAll(): Promise<Assessment[]>;
  findById(id: string): Promise<Assessment | null>;
  findByCompanyId(companyId: string): Promise<Assessment[]>;
  create(input: CreateAssessmentInput): Promise<Assessment>;
  update(id: string, input: UpdateAssessmentInput): Promise<Assessment>;
  delete(id: string): Promise<void>;
}

export type AssessmentLifecycleRepository = AssessmentRepository &
  AssessmentLifecycleOperations;

type AssessmentRepositoryDb = Pick<RepositoryClient, 'assessment'> &
  Partial<Pick<RepositoryClient, 'activity' | '$transaction'>>;

const hasLifecycleDb = (
  db: AssessmentRepositoryDb,
): db is AssessmentRepositoryDb & AssessmentLifecycleDb =>
  'activity' in db && typeof db.$transaction === 'function';

export const hasAssessmentLifecycleOperations = (
  repository: AssessmentRepository,
): repository is AssessmentLifecycleRepository =>
  typeof repository.complete === 'function' &&
  typeof repository.reopen === 'function' &&
  typeof repository.archive === 'function' &&
  typeof repository.restore === 'function';

const buildArchivedCreateFields = (input: CreateAssessmentInput) => {
  if (input.status !== 'archived') {
    return {};
  }

  return {
    archivedAt: new Date(),
    archivedFromStatus: input.completedAt
      ? 'completed'
      : input.startedAt
        ? 'in-progress'
        : 'draft',
  };
};

const activeAssessmentWhere = {
  status: { not: 'archived' },
} as const;

export function createAssessmentRepository(
  db: AssessmentRepositoryDb,
): AssessmentRepository {
  const lifecycle = hasLifecycleDb(db)
    ? createAssessmentLifecycleOperations(db)
    : {};

  return {
    ...lifecycle,

    async findAll() {
      const assessments = await db.assessment.findMany({
        where: activeAssessmentWhere,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: assessmentListSelect,
      });

      return assessments.map(toAssessmentListRecord);
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
        where: { companyId, ...activeAssessmentWhere },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: assessmentListSelect,
      });

      return assessments.map(toAssessmentListRecord);
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
            cweCatalogVersion: CWE_CATALOG_CURRENT_VERSION,
            ...buildArchivedCreateFields(input),
          },
          select: assessmentSelect,
        });

        return toAssessment(assessment);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      const existing = await db.assessment.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!existing) {
        throw new RepositoryNotFoundError('Assessment not found.');
      }

      if (existing.status === 'archived') {
        throw new RepositoryStateError('Archived Assessments are read-only.');
      }

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
