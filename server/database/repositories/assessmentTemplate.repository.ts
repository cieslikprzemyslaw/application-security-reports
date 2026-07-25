import type {
  AssessmentTemplate,
  AssessmentTemplateListOptions,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
} from '../../../src/domain/assessmentTemplate.js';
import { generateId } from '../../utils/id.js';
import {
  mapPrismaError,
  RepositoryNotFoundError,
  RepositoryStateError,
} from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';

type AssessmentTemplateRepositoryDb = Pick<
  RepositoryClient,
  'assessmentTemplate'
>;

const assessmentTemplateSelect = {
  id: true,
  name: true,
  assessmentType: true,
  environment: true,
  description: true,
  scope: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AssessmentTemplateRow = {
  id: string;
  name: string;
  assessmentType: string;
  environment: string;
  description: string | null;
  scope: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toAssessmentTemplate = (
  row: AssessmentTemplateRow,
): AssessmentTemplate => ({
  id: row.id,
  name: row.name,
  assessmentType: row.assessmentType,
  environment: row.environment,
  ...(row.description ? { description: row.description } : {}),
  ...(row.scope ? { scope: row.scope } : {}),
  archivedAt: row.archivedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export interface AssessmentTemplateRepository {
  findAll(
    options?: AssessmentTemplateListOptions,
  ): Promise<AssessmentTemplate[]>;
  findById(id: string): Promise<AssessmentTemplate | null>;
  create(input: CreateAssessmentTemplateInput): Promise<AssessmentTemplate>;
  update(
    id: string,
    input: UpdateAssessmentTemplateInput,
  ): Promise<AssessmentTemplate>;
  archive(id: string): Promise<AssessmentTemplate>;
  restore(id: string): Promise<AssessmentTemplate>;
}

export const createAssessmentTemplateRepository = (
  db: AssessmentTemplateRepositoryDb,
): AssessmentTemplateRepository => ({
  async findAll(options = {}) {
    const rows = await db.assessmentTemplate.findMany({
      where: options.includeArchived ? undefined : { archivedAt: null },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: assessmentTemplateSelect,
    });

    return rows.map(toAssessmentTemplate);
  },

  async findById(id) {
    const row = await db.assessmentTemplate.findUnique({
      where: { id },
      select: assessmentTemplateSelect,
    });

    return row ? toAssessmentTemplate(row) : null;
  },

  async create(input) {
    try {
      const row = await db.assessmentTemplate.create({
        data: {
          id: generateId('assessmentTemplate'),
          name: input.name,
          assessmentType: input.assessmentType,
          environment: input.environment,
          description: input.description,
          scope: input.scope,
        },
        select: assessmentTemplateSelect,
      });

      return toAssessmentTemplate(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async update(id, input) {
    const existing = await db.assessmentTemplate.findUnique({
      where: { id },
      select: { archivedAt: true },
    });

    if (!existing) {
      throw new RepositoryNotFoundError('Assessment Template not found.');
    }

    if (existing.archivedAt) {
      throw new RepositoryStateError(
        'Archived Assessment Templates are read-only.',
      );
    }

    try {
      const row = await db.assessmentTemplate.update({
        where: { id },
        data: input,
        select: assessmentTemplateSelect,
      });

      return toAssessmentTemplate(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async archive(id) {
    const existing = await db.assessmentTemplate.findUnique({
      where: { id },
      select: assessmentTemplateSelect,
    });

    if (!existing) {
      throw new RepositoryNotFoundError('Assessment Template not found.');
    }

    if (existing.archivedAt) {
      return toAssessmentTemplate(existing);
    }

    try {
      const row = await db.assessmentTemplate.update({
        where: { id },
        data: { archivedAt: new Date() },
        select: assessmentTemplateSelect,
      });

      return toAssessmentTemplate(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async restore(id) {
    const existing = await db.assessmentTemplate.findUnique({
      where: { id },
      select: assessmentTemplateSelect,
    });

    if (!existing) {
      throw new RepositoryNotFoundError('Assessment Template not found.');
    }

    if (!existing.archivedAt) {
      return toAssessmentTemplate(existing);
    }

    try {
      const row = await db.assessmentTemplate.update({
        where: { id },
        data: { archivedAt: null },
        select: assessmentTemplateSelect,
      });

      return toAssessmentTemplate(row);
    } catch (error) {
      throw mapPrismaError(error);
    }
  },
});
