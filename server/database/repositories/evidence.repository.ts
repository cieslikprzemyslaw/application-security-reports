import type { Evidence } from '../../../src/domain/evidence.js';
import type {
  CreateEvidenceInput,
  UpdateEvidenceInput,
} from '../../../src/domain/evidence.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError } from '../errors.js';
import type {
  RepositoryClient,
  RepositoryTransactionClient,
} from '../repository.types.js';
import {
  dedupeStrings,
  toIsoString,
  toOptionalText,
} from './repository.helpers.js';

export interface EvidenceRepository {
  findById(id: string): Promise<Evidence | null>;
  findByAssessmentId(assessmentId: string): Promise<Evidence[]>;
  create(input: CreateEvidenceInput): Promise<Evidence>;
  update(id: string, input: UpdateEvidenceInput): Promise<Evidence>;
  delete(id: string): Promise<void>;
  attachToThreat(evidenceId: string, threatId: string): Promise<void>;
  detachFromThreat(evidenceId: string, threatId: string): Promise<void>;
}

type EvidenceRepositoryDb = Pick<
  RepositoryClient,
  'evidence' | 'evidenceThreat' | '$transaction'
>;

type EvidenceLookupDb = Pick<RepositoryClient, 'evidence'>;

type EvidenceLinkDb = Pick<RepositoryClient, 'evidenceThreat'>;

type EvidenceRow = {
  id: string;
  assessmentId: string;
  threatLinks: Array<{ threatId: string }>;
  type: string;
  title: string;
  description: string | null;
  content: string | null;
  fileName: string | null;
  filePath: string | null;
  mimeType: string | null;
  capturedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const evidenceSelect = {
  id: true,
  assessmentId: true,
  threatLinks: {
    select: { threatId: true },
    orderBy: { threatId: 'asc' },
  },
  type: true,
  title: true,
  description: true,
  content: true,
  fileName: true,
  filePath: true,
  mimeType: true,
  capturedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toEvidence = (row: EvidenceRow): Evidence => ({
  id: row.id,
  assessmentId: row.assessmentId,
  threatIds: row.threatLinks.map(link => link.threatId),
  type: row.type as Evidence['type'],
  title: row.title,
  description: toOptionalText(row.description),
  content: toOptionalText(row.content),
  fileName: toOptionalText(row.fileName),
  filePath: toOptionalText(row.filePath),
  mimeType: toOptionalText(row.mimeType),
  capturedAt: toOptionalText(row.capturedAt) as Evidence['capturedAt'],
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

const loadEvidenceById = async (
  db: EvidenceLookupDb,
  id: string,
): Promise<Evidence | null> => {
  const evidence = await db.evidence.findUnique({
    where: { id },
    select: evidenceSelect,
  });

  return evidence ? toEvidence(evidence) : null;
};

const replaceEvidenceThreatLinks = async (
  db: EvidenceLinkDb,
  evidenceId: string,
  threatIds: readonly string[],
) => {
  await db.evidenceThreat.deleteMany({
    where: { evidenceId },
  });

  const uniqueThreatIds = dedupeStrings(threatIds);

  if (uniqueThreatIds.length === 0) {
    return;
  }

  await db.evidenceThreat.createMany({
    data: uniqueThreatIds.map(threatId => ({ evidenceId, threatId })),
  });
};

export function createEvidenceRepository(
  db: EvidenceRepositoryDb,
): EvidenceRepository {
  return {
    async findById(id) {
      return loadEvidenceById(db, id);
    },

    async findByAssessmentId(assessmentId) {
      const evidence = await db.evidence.findMany({
        where: { assessmentId },
        orderBy: [{ createdAt: 'desc' }],
        select: evidenceSelect,
      });

      return evidence.map(toEvidence);
    },

    async create(input) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            const evidence = await tx.evidence.create({
              data: {
                id: generateId('evidence'),
                assessmentId: input.assessmentId,
                type: input.type,
                title: input.title,
                description: input.description,
                content: input.content,
                fileName: input.fileName,
                filePath: input.filePath,
                mimeType: input.mimeType,
                capturedAt: input.capturedAt,
                threatLinks: input.threatIds
                  ? {
                      create: dedupeStrings(input.threatIds).map(threatId => ({
                        threatId,
                      })),
                    }
                  : undefined,
              },
              select: evidenceSelect,
            });

            return toEvidence(evidence);
          },
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            await tx.evidence.update({
              where: { id },
              data: {
                assessmentId: input.assessmentId,
                type: input.type,
                title: input.title,
                description: input.description,
                content: input.content,
                fileName: input.fileName,
                filePath: input.filePath,
                mimeType: input.mimeType,
                capturedAt: input.capturedAt,
              },
            });

            if (input.threatIds) {
              await replaceEvidenceThreatLinks(tx, id, input.threatIds);
            }

            const evidence = await loadEvidenceById(tx, id);

            if (!evidence) {
              throw new Error('Evidence disappeared during update.');
            }

            return evidence;
          },
        );
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async delete(id) {
      try {
        await db.evidence.delete({ where: { id } });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async attachToThreat(evidenceId, threatId) {
      try {
        await db.evidenceThreat.create({
          data: { evidenceId, threatId },
        });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async detachFromThreat(evidenceId, threatId) {
      try {
        await db.evidenceThreat.delete({
          where: {
            evidenceId_threatId: {
              evidenceId,
              threatId,
            },
          },
        });
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
