import type { Threat } from '../../../src/domain/threat.js';
import type {
  CreateThreatInput,
  UpdateThreatInput,
} from '../../../src/domain/threat.js';
import { createThreatOwaspCategoryCodeSchema } from '../../../src/domain/schemas/threat.schema.js';
import {
  ValidationError,
  formatValidationErrors,
} from '../../../src/validation/index.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryNotFoundError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';
import { z } from 'zod';

export interface ThreatRepository {
  findById(id: string): Promise<Threat | null>;
  findByAssessmentId(assessmentId: string): Promise<Threat[]>;
  create(input: CreateThreatInput): Promise<Threat>;
  update(id: string, input: UpdateThreatInput): Promise<Threat>;
  delete(id: string): Promise<void>;
}

type ThreatRepositoryDb = Pick<RepositoryClient, 'assessment' | 'threat'>;

type ThreatRow = {
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
};

const threatSelect = {
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
} as const;

const assessmentTaxonomySelect = {
  owaspTaxonomyVersion: true,
} as const;

const threatCategoryCodeSchema = (assessmentVersion: string) =>
  z
    .object({
      owaspCategoryCode: createThreatOwaspCategoryCodeSchema(assessmentVersion),
    })
    .strict();

const loadAssessmentTaxonomyVersion = async (
  db: ThreatRepositoryDb,
  assessmentId: string,
) => {
  const assessment = await db.assessment.findUnique({
    where: { id: assessmentId },
    select: assessmentTaxonomySelect,
  });

  return assessment?.owaspTaxonomyVersion;
};

const loadThreatById = async (db: ThreatRepositoryDb, id: string) => {
  const threat = await db.threat.findUnique({
    where: { id },
    select: threatSelect,
  });

  return threat ? toThreat(threat) : null;
};

const validateThreatCategoryCodeForAssessment = (
  owaspCategoryCode: string | undefined,
  assessmentVersion: string,
) => {
  if (!owaspCategoryCode || owaspCategoryCode === 'custom') {
    return;
  }

  const result = threatCategoryCodeSchema(assessmentVersion).safeParse({
    owaspCategoryCode,
  });

  if (!result.success) {
    throw new ValidationError(formatValidationErrors(result.error));
  }
};

const normalizeCustomCategoryForRead = (
  owaspCategoryCode?: string | null,
  customCategory?: string | null,
) =>
  owaspCategoryCode === 'custom' ? toOptionalText(customCategory) : undefined;

const normalizeCustomCategoryForWrite = (
  owaspCategoryCode?: string | null,
  customCategory?: string | null,
) =>
  owaspCategoryCode === 'custom'
    ? (toOptionalText(customCategory) ?? null)
    : null;

const toThreatWriteData = (input: CreateThreatInput | UpdateThreatInput) => {
  const { owaspTaxonomyVersion: _owaspTaxonomyVersion, ...sanitizedInput } =
    input as CreateThreatInput & { owaspTaxonomyVersion?: unknown };
  const data: Record<string, unknown> = {
    ...sanitizedInput,
  };

  if ('owaspCategoryCode' in input) {
    data.owaspCategoryCode = toOptionalText(input.owaspCategoryCode);
    data.customCategory = normalizeCustomCategoryForWrite(
      input.owaspCategoryCode,
      input.customCategory,
    );
  } else if ('customCategory' in input) {
    data.customCategory = toOptionalText(input.customCategory);
  }

  if ('remediation' in input) {
    data.remediation = toOptionalText(input.remediation);
  }

  if ('reproductionSteps' in input) {
    data.reproductionSteps = toOptionalText(input.reproductionSteps);
  }

  if ('references' in input) {
    data.references = toOptionalText(input.references);
  }

  return data;
};

const toThreat = (row: ThreatRow): Threat => ({
  id: row.id,
  assessmentId: row.assessmentId,
  title: row.title,
  description: row.description,
  severity: row.severity as Threat['severity'],
  strideCategories: Array.isArray(row.strideCategories)
    ? (row.strideCategories as Threat['strideCategories'])
    : [],
  status: row.status as Threat['status'],
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
});

export function createThreatRepository(
  db: ThreatRepositoryDb,
): ThreatRepository {
  const threatDb = db.threat as unknown as {
    findUnique(args: {
      where: { id: string };
      select: typeof threatSelect;
    }): Promise<ThreatRow | null>;
    findMany(args: {
      where: { assessmentId: string };
      orderBy: Array<{ updatedAt: 'desc' } | { createdAt: 'desc' }>;
      select: typeof threatSelect;
    }): Promise<ThreatRow[]>;
    create(args: {
      data: Record<string, unknown>;
      select: typeof threatSelect;
    }): Promise<ThreatRow>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
      select: typeof threatSelect;
    }): Promise<ThreatRow>;
    delete(args: { where: { id: string } }): Promise<unknown>;
  };

  return {
    async findById(id) {
      return loadThreatById(db, id);
    },

    async findByAssessmentId(assessmentId) {
      const threats = await threatDb.findMany({
        where: { assessmentId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: threatSelect,
      });

      return threats.map(toThreat);
    },

    async create(input) {
      try {
        const assessmentVersion = await loadAssessmentTaxonomyVersion(
          db,
          input.assessmentId,
        );

        if (!assessmentVersion) {
          throw new RepositoryNotFoundError('Assessment not found.');
        }

        validateThreatCategoryCodeForAssessment(
          input.owaspCategoryCode,
          assessmentVersion,
        );

        const threat = await threatDb.create({
          data: {
            id: generateId('threat'),
            ...toThreatWriteData(input),
          },
          select: threatSelect,
        });

        return toThreat(threat);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }

        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        const existingThreat = await loadThreatById(db, id);

        if (!existingThreat) {
          throw new RepositoryNotFoundError('Threat not found.');
        }

        const assessmentVersion = await loadAssessmentTaxonomyVersion(
          db,
          existingThreat.assessmentId,
        );

        if (!assessmentVersion) {
          throw new RepositoryNotFoundError('Assessment not found.');
        }

        validateThreatCategoryCodeForAssessment(
          input.owaspCategoryCode ?? existingThreat.owaspCategoryCode,
          assessmentVersion,
        );

        const threat = await threatDb.update({
          where: { id },
          data: toThreatWriteData(input),
          select: threatSelect,
        });

        return toThreat(threat);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }

        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await threatDb.delete({ where: { id } });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
