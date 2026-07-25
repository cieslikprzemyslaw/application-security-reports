import type { Assessment } from '../../../src/domain/assessment.js';
import {
  CWE_CATALOG_CURRENT_VERSION,
} from '../../../src/domain/cwe.js';
import type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from '../../../src/domain/assessment.js';
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
  type AssessmentLifecycleOperations,
} from './assessment-lifecycle.repository.js';
import {
  assessmentListSelect,
  assessmentSelect,
  toAssessment,
  toAssessmentListRecord,
  type AssessmentListRecord,
} from './assessment.repository.shared.js';

export type { AssessmentListRecord } from './assessment.repository.shared.js';

export interface AssessmentRepository extends AssessmentLifecycleOperations {
  findAll(): Promise<Assessment[]>;
  findById(id: string): Promise<Assessment | null>;
  findByCompanyId(companyId: string): Promise<Assessment[]>;
  create(input: CreateAssessmentInput): Promise<Assessment>;
  update(id: string, input: UpdateAssessmentInput): Promise<Assessment>;
  delete(id: string): Promise<void>;
}

type AssessmentRepositoryDb = Pick<
  RepositoryClient,
  'assessment' | 'activity' | '$transaction'
>;

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

export function createAssessmentRepository(
  db: AssessmentRepositoryDb,
): AssessmentRepository {
  const lifecycle = createAssessmentLifecycleOperations(db);

  return {
    ...lifecycle,

    async findAll() {
      const assessments = await db.assessment.findMany({
        where: { archivedAt: null },
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
        where: { companyId, archivedAt: null },
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
            recordVersion: 0,
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
        select: { archivedAt: true },
      });

      if (!existing) {
        throw new RepositoryNotFoundError('Assessment not found.');
      }

      if (existing.archivedAt !== null) {
        throw new RepositoryStateError('Archived Assessments are read-only.');
      }

      try {
        const assessment = await db.assessment.update({
          where: { id },
          data: {
            ...input,
            recordVersion: { increment: 1 },
          },
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
