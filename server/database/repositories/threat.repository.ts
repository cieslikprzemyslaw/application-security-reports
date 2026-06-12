import type { Threat } from '../../../src/domain/threat.js';
import type {
  CreateThreatInput,
  UpdateThreatInput,
} from '../../../src/domain/threat.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import { toIsoString, toOptionalText } from './repository.helpers.js';

export interface ThreatRepository {
  findById(id: string): Promise<Threat | null>;
  findByAssessmentId(assessmentId: string): Promise<Threat[]>;
  create(input: CreateThreatInput): Promise<Threat>;
  update(id: string, input: UpdateThreatInput): Promise<Threat>;
  delete(id: string): Promise<void>;
}

type ThreatRepositoryDb = Pick<RepositoryClient, 'threat'>;

type ThreatRow = {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  severity: string;
  strideCategories: unknown;
  status: string;
  affectedAsset: string | null;
  impact: string | null;
  recommendation: string | null;
  observation: string | null;
  affectedComponent: string | null;
  affectedEndpoint: string | null;
  risk: string | null;
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
  affectedAsset: true,
  impact: true,
  recommendation: true,
  observation: true,
  affectedComponent: true,
  affectedEndpoint: true,
  risk: true,
  createdAt: true,
  updatedAt: true,
} as const;

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
  affectedAsset: toOptionalText(row.affectedAsset),
  impact: toOptionalText(row.impact),
  recommendation: toOptionalText(row.recommendation),
  observation: toOptionalText(row.observation),
  affectedComponent: toOptionalText(row.affectedComponent),
  affectedEndpoint: toOptionalText(row.affectedEndpoint),
  risk: toOptionalText(row.risk),
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
});

export function createThreatRepository(
  db: ThreatRepositoryDb,
): ThreatRepository {
  return {
    async findById(id) {
      const threat = await db.threat.findUnique({
        where: { id },
        select: threatSelect,
      });

      return threat ? toThreat(threat) : null;
    },

    async findByAssessmentId(assessmentId) {
      const threats = await db.threat.findMany({
        where: { assessmentId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: threatSelect,
      });

      return threats.map(toThreat);
    },

    async create(input) {
      try {
        const threat = await db.threat.create({
          data: {
            id: generateId('threat'),
            assessmentId: input.assessmentId,
            title: input.title,
            description: input.description,
            severity: input.severity,
            strideCategories: input.strideCategories,
            status: input.status,
            affectedAsset: input.affectedAsset,
            impact: input.impact,
            recommendation: input.recommendation,
            observation: input.observation,
            affectedComponent: input.affectedComponent,
            affectedEndpoint: input.affectedEndpoint,
            risk: input.risk,
          },
          select: threatSelect,
        });

        return toThreat(threat);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },

    async update(id, input) {
      try {
        const threat = await db.threat.update({
          where: { id },
          data: input,
          select: threatSelect,
        });

        return toThreat(threat);
      } catch (error) {
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
