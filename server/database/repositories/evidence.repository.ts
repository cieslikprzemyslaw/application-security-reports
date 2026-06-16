import path from 'node:path';

import type { Evidence } from '../../../src/domain/evidence.js';
import type {
  CreateEvidenceInput,
  EvidenceHttpExchange,
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
  'evidence' | 'evidenceExchange' | 'evidenceThreat' | '$transaction'
>;

type EvidenceLookupDb = Pick<RepositoryClient, 'evidence'>;

type EvidenceLinkDb = Pick<RepositoryClient, 'evidenceThreat'>;

type EvidenceExchangeLinkDb = Pick<RepositoryClient, 'evidenceExchange'>;

type EvidenceExchangeRow = {
  request: unknown;
  response: unknown;
};

type EvidenceRow = {
  id: string;
  assessmentId: string;
  threatLinks: Array<{ threatId: string }>;
  httpExchanges: Array<{
    position: number;
    request: unknown;
    response: unknown;
  }>;
  type: string;
  title: string;
  description: string | null;
  content: string | null;
  fileName: string | null;
  filePath: string | null;
  storageKey: string | null;
  mimeType: string | null;
  attachmentSizeBytes: number | null;
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
  httpExchanges: {
    select: {
      position: true,
      request: true,
      response: true,
    },
    orderBy: { position: 'asc' },
  },
  type: true,
  title: true,
  description: true,
  content: true,
  fileName: true,
  filePath: true,
  storageKey: true,
  mimeType: true,
  attachmentSizeBytes: true,
  capturedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const buildAttachmentStorageKey = (
  evidenceId: string,
  fileName: string,
): string => {
  const extension = path.extname(fileName).toLowerCase();
  const attachmentId = generateId('evidenceExchange');

  return `uploads/evidence/${evidenceId}/${attachmentId}${extension}`;
};

const toHttpExchange = (row: EvidenceExchangeRow): EvidenceHttpExchange => ({
  request: row.request as EvidenceHttpExchange['request'],
  response: row.response as EvidenceHttpExchange['response'],
});

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
  storageKey: toOptionalText(row.storageKey),
  mimeType: toOptionalText(row.mimeType),
  attachmentSizeBytes: row.attachmentSizeBytes ?? undefined,
  capturedAt: toOptionalText(row.capturedAt) as Evidence['capturedAt'],
  httpExchanges: row.httpExchanges.map(toHttpExchange),
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

const replaceEvidenceHttpExchanges = async (
  db: EvidenceExchangeLinkDb,
  evidenceId: string,
  exchanges: readonly EvidenceHttpExchange[],
) => {
  await db.evidenceExchange.deleteMany({
    where: { evidenceId },
  });

  if (exchanges.length === 0) {
    return;
  }

  await db.evidenceExchange.createMany({
    data: exchanges.map((exchange, position) => ({
      id: generateId('evidenceExchange'),
      evidenceId,
      position,
      request: exchange.request,
      response: exchange.response,
    })),
  });
};

const buildEvidenceData = (
  input: CreateEvidenceInput | UpdateEvidenceInput,
  evidenceId: string,
) => {
  const data: Record<string, unknown> = {
    assessmentId: input.assessmentId,
    type: input.type,
    title: input.title,
    description: input.description,
    content: input.content,
    fileName: input.fileName,
    mimeType: input.mimeType,
    attachmentSizeBytes: input.attachmentSizeBytes,
    capturedAt: input.capturedAt,
  };

  if (input.fileName) {
    const storageKey = buildAttachmentStorageKey(evidenceId, input.fileName);

    data.filePath = storageKey;
    data.storageKey = storageKey;
  }

  return data;
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
        const evidenceId = generateId('evidence');

        return await db.$transaction(
          async (tx: RepositoryTransactionClient) => {
            const evidence = await tx.evidence.create({
              data: {
                id: evidenceId,
                ...buildEvidenceData(input, evidenceId),
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

            if (input.httpExchanges) {
              await replaceEvidenceHttpExchanges(
                tx,
                evidence.id,
                input.httpExchanges,
              );

              const loadedEvidence = await loadEvidenceById(tx, evidence.id);

              if (!loadedEvidence) {
                throw new Error('Evidence disappeared during create.');
              }

              return loadedEvidence;
            }

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
              data: buildEvidenceData(input, id),
            });

            if (input.threatIds) {
              await replaceEvidenceThreatLinks(tx, id, input.threatIds);
            }

            if (input.httpExchanges) {
              await replaceEvidenceHttpExchanges(tx, id, input.httpExchanges);
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
