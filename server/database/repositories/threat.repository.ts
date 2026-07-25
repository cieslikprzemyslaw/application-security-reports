import { z } from 'zod';

import type {
  CreateThreatInput,
  Threat,
  UpdateThreatInput,
} from '../../../src/domain/threat.js';
import {
  isOwaspTop10Version,
  type OwaspTop10Version,
} from '../../../src/domain/owaspTop10.js';
import { createThreatOwaspCategoryCodeSchema } from '../../../src/domain/schemas/threat.schema.js';
import {
  ValidationError,
  formatValidationErrors,
} from '../../../src/validation/index.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryNotFoundError } from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import { toOptionalText } from './repository.helpers.js';
import {
  threatSelect,
  toThreat,
  type ThreatRow,
} from './threat.repository.mapping.js';
import {
  createThreatReviewOperations,
  type ThreatReviewDb,
  type ThreatReviewOperations,
} from './threat-review.repository.js';
import {
  parseAssessmentCweCatalogVersion,
  toOrderedThreatCweLinks,
  validateNewThreatCweIds,
  type AssessmentThreatTaxonomyRow,
} from './threat-cwe.repository.js';

export interface ThreatRepository extends Partial<ThreatReviewOperations> {
  findById(id: string): Promise<Threat | null>;
  findByAssessmentId(assessmentId: string): Promise<Threat[]>;
  create(input: CreateThreatInput): Promise<Threat>;
  update(id: string, input: UpdateThreatInput): Promise<Threat>;
  delete(id: string): Promise<void>;
}

type ThreatRepositoryDb = Pick<RepositoryClient, 'assessment' | 'threat'> &
  Partial<Pick<RepositoryClient, 'threatCwe' | '$transaction'>>;
type ThreatTransactionDb = Pick<
  RepositoryTransactionClient,
  'assessment' | 'threat'
> &
  Partial<Pick<RepositoryTransactionClient, 'threatCwe'>>;
const hasThreatReviewDb = (
  db: ThreatRepositoryDb,
): db is ThreatRepositoryDb & ThreatReviewDb =>
  typeof db.$transaction === 'function';

export const hasThreatReviewOperations = (
  repository: ThreatRepository,
): repository is ThreatRepository & ThreatReviewOperations =>
  typeof repository.transitionReview === 'function';

type ThreatReadDb =
  | Pick<ThreatRepositoryDb, 'threat'>
  | Pick<ThreatTransactionDb, 'threat'>;

const runThreatTransaction = <T>(
  db: ThreatRepositoryDb,
  operation: (tx: ThreatTransactionDb) => Promise<T>,
): Promise<T> => {
  if (db.$transaction) {
    return db.$transaction((tx: RepositoryTransactionClient) => operation(tx));
  }

  return operation(db);
};

const requireThreatCweDelegate = (db: ThreatTransactionDb) => {
  if (!db.threatCwe) {
    throw new Error('Threat CWE persistence delegate is unavailable.');
  }

  return db.threatCwe;
};

const assessmentTaxonomySelect = {
  owaspTaxonomyVersion: true,
  cweCatalogVersion: true,
} as const;

const loadAssessmentTaxonomy = async (
  db:
    | Pick<ThreatRepositoryDb, 'assessment'>
    | Pick<ThreatTransactionDb, 'assessment'>,
  assessmentId: string,
): Promise<AssessmentThreatTaxonomyRow | undefined> => {
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    select: assessmentTaxonomySelect,
  });

  return assessment ?? undefined;
};

const parseOwaspVersion = (
  assessment: AssessmentThreatTaxonomyRow,
): OwaspTop10Version => {
  if (!isOwaspTop10Version(assessment.owaspTaxonomyVersion)) {
    throw new ValidationError({
      error: 'VALIDATION_ERROR',
      fields: [
        {
          path: 'owaspTaxonomyVersion',
          message: `Unsupported OWASP taxonomy version: ${assessment.owaspTaxonomyVersion}`,
          code: 'custom',
        },
      ],
    });
  }

  return assessment.owaspTaxonomyVersion;
};

const validateThreatCategory = (
  value: string | undefined,
  version: OwaspTop10Version,
) => {
  if (!value || value === 'custom') return;

  const result = z
    .object({ owaspCategoryCode: createThreatOwaspCategoryCodeSchema(version) })
    .strict()
    .safeParse({ owaspCategoryCode: value });

  if (!result.success) {
    throw new ValidationError(formatValidationErrors(result.error));
  }
};

const normalizeCustomCategoryForWrite = (
  code?: string | null,
  custom?: string | null,
) => (code === 'custom' ? (toOptionalText(custom) ?? null) : null);

const toThreatWriteData = (input: CreateThreatInput | UpdateThreatInput) => {
  const {
    cweIds: _cweIds,
    cweCatalogVersion: _cweCatalogVersion,
    cweMappings: _cweMappings,
    owaspTaxonomyVersion: _owaspTaxonomyVersion,
    ...sanitizedInput
  } = input as CreateThreatInput & {
    cweCatalogVersion?: unknown;
    cweMappings?: unknown;
    owaspTaxonomyVersion?: unknown;
  };
  const data: Record<string, unknown> = { ...sanitizedInput };

  if ('owaspCategoryCode' in input) {
    data.owaspCategoryCode = toOptionalText(input.owaspCategoryCode);
    data.customCategory = normalizeCustomCategoryForWrite(
      input.owaspCategoryCode,
      input.customCategory,
    );
  } else if ('customCategory' in input) {
    data.customCategory = toOptionalText(input.customCategory);
  }

  for (const field of [
    'remediation',
    'reproductionSteps',
    'references',
  ] as const) {
    if (field in input) data[field] = toOptionalText(input[field]);
  }

  return data;
};

const loadThreatById = async (db: ThreatReadDb, id: string) => {
  const row = (await db.threat.findUnique({
    where: { id },
    select: threatSelect,
  })) as ThreatRow | null;

  return row ? toThreat(row) : null;
};

export function createThreatRepository(
  db: ThreatRepositoryDb,
): ThreatRepository {
  const review = hasThreatReviewDb(db) ? createThreatReviewOperations(db) : {};

  return {
    ...review,
    findById: id => loadThreatById(db, id),

    async findByAssessmentId(assessmentId) {
      const rows = (await db.threat.findMany({
        where: { assessmentId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: threatSelect,
      })) as ThreatRow[];

      return rows.map(toThreat);
    },

    async create(input) {
      try {
        return await runThreatTransaction(db, async tx => {
          const assessment = await loadAssessmentTaxonomy(
            tx,
            input.assessmentId,
          );
          if (!assessment)
            throw new RepositoryNotFoundError('Assessment not found.');

          validateThreatCategory(
            input.owaspCategoryCode,
            parseOwaspVersion(assessment),
          );
          const cweIds = validateNewThreatCweIds(
            input.cweIds,
            parseAssessmentCweCatalogVersion(assessment),
          );
          const links = toOrderedThreatCweLinks(cweIds);
          const row = (await tx.threat.create({
            data: {
              id: generateId('threat'),
              ...toThreatWriteData(input),
              ...(links.length > 0 ? { cweMappings: { create: links } } : {}),
            },
            select: threatSelect,
          })) as ThreatRow;

          return toThreat(row);
        });
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof RepositoryNotFoundError
        ) {
          throw error;
        }
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        return await runThreatTransaction(db, async tx => {
          const existing = await loadThreatById(tx, id);
          if (!existing) throw new RepositoryNotFoundError('Threat not found.');

          const assessment = await loadAssessmentTaxonomy(
            tx,
            existing.assessmentId,
          );
          if (!assessment)
            throw new RepositoryNotFoundError('Assessment not found.');

          validateThreatCategory(
            input.owaspCategoryCode ?? existing.owaspCategoryCode,
            parseOwaspVersion(assessment),
          );

          await tx.threat.update({
            where: { id },
            data: toThreatWriteData(input),
            select: { id: true },
          });

          if (input.cweIds !== undefined) {
            const cweIds = validateNewThreatCweIds(
              input.cweIds,
              parseAssessmentCweCatalogVersion(assessment),
            );
            const threatCwe = requireThreatCweDelegate(tx);
            await threatCwe.deleteMany({ where: { threatId: id } });
            const links = toOrderedThreatCweLinks(cweIds);
            if (links.length > 0) {
              await threatCwe.createMany({
                data: links.map(link => ({ threatId: id, ...link })),
              });
            }
          }

          const updated = await loadThreatById(tx, id);
          if (!updated) throw new RepositoryNotFoundError('Threat not found.');
          return updated;
        });
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof RepositoryNotFoundError
        ) {
          throw error;
        }
        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await db.threat.delete({ where: { id } });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
