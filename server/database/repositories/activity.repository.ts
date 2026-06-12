import type { Activity } from '../../../src/domain/activity.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import {
  normalizeLimit,
  toIsoString,
  type ActivityCreateInput,
  type ActivityFindByEntityInput,
} from './repository.helpers.js';

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>;
  findRecent(limit?: number): Promise<Activity[]>;
  findByEntity(input: ActivityFindByEntityInput): Promise<Activity[]>;
  create(input: ActivityCreateInput): Promise<Activity>;
}

type ActivityRepositoryDb = Pick<RepositoryClient, 'activity'>;

type ActivityRow = {
  id: string;
  entityType: Activity['entityType'];
  entityId: string | null;
  action: Activity['action'];
  message: string;
  createdAt: Date;
};

const activitySelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  message: true,
  createdAt: true,
} as const;

const toActivity = (row: ActivityRow): Activity => ({
  id: row.id,
  entityType: row.entityType,
  entityId: row.entityId ?? undefined,
  action: row.action,
  message: row.message,
  createdAt: toIsoString(row.createdAt),
});

export function createActivityRepository(
  db: ActivityRepositoryDb,
): ActivityRepository {
  return {
    async findById(id) {
      const activity = await db.activity.findUnique({
        where: { id },
        select: activitySelect,
      });

      return activity ? toActivity(activity) : null;
    },

    async findRecent(limit = 20) {
      const activities = await db.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: normalizeLimit(limit, 20),
        select: activitySelect,
      });

      return activities.map(toActivity);
    },

    async findByEntity(input) {
      const activities = await db.activity.findMany({
        where: {
          entityType: input.entityType,
          ...(input.entityId ? { entityId: input.entityId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: normalizeLimit(input.limit, 20),
        select: activitySelect,
      });

      return activities.map(toActivity);
    },

    async create(input) {
      try {
        const activity = await db.activity.create({
          data: {
            id: generateId('activity'),
            entityType: input.entityType,
            entityId: input.entityId,
            action: input.action,
            message: input.message,
            createdAt: new Date(),
          },
          select: activitySelect,
        });

        return toActivity(activity);
      } catch (error) {
        throw mapPrismaError(error);
      }
    },
  };
}
