import type {
  Activity,
  AppendActivityInput,
} from '../../../src/domain/activity.js';
import {
  ACTIVITY_ACTOR_TYPES,
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_RESULTS,
  ACTIVITY_SEVERITIES,
  type ActivityActorType,
  type ActivityEventType,
  type ActivityResult,
  type ActivitySeverity,
} from '../../../src/domain/common.js';
import { generateId } from '../../utils/id.js';
import { mapPrismaError, RepositoryError } from '../errors.js';
import type { RepositoryClient } from '../repository.types.js';
import {
  normalizeLimit,
  toIsoString,
  type ActivityFindByEntityInput,
  type ActivityScopeQuery,
} from './repository.helpers.js';

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>;
  findRecent(limit?: number): Promise<Activity[]>;
  findByEntity(input: ActivityFindByEntityInput): Promise<Activity[]>;
  findByCompanyId(input: ActivityScopeQuery): Promise<Activity[]>;
  findByAssessmentId(input: ActivityScopeQuery): Promise<Activity[]>;
  append(input: AppendActivityInput): Promise<Activity>;
  create(input: AppendActivityInput): Promise<Activity>;
}

type ActivityRepositoryDb = Pick<RepositoryClient, 'activity'>;

type ActivityRow = {
  id: string;
  eventType: string;
  result: string;
  severity: string;
  actorType: string;
  actorId: string | null;
  resourceType: Activity['resource']['type'];
  resourceId: string;
  companyId: string | null;
  assessmentId: string | null;
  correlationId: string | null;
  message: string;
  createdAt: Date;
};

const activitySelect = {
  id: true,
  eventType: true,
  result: true,
  severity: true,
  actorType: true,
  actorId: true,
  resourceType: true,
  resourceId: true,
  companyId: true,
  assessmentId: true,
  correlationId: true,
  message: true,
  createdAt: true,
} as const;

const includes = <T extends string>(values: readonly T[], value: string): value is T =>
  values.includes(value as T);

const toActivity = (row: ActivityRow): Activity => {
  if (
    !includes(ACTIVITY_EVENT_TYPES, row.eventType) ||
    !includes(ACTIVITY_RESULTS, row.result) ||
    !includes(ACTIVITY_SEVERITIES, row.severity) ||
    !includes(ACTIVITY_ACTOR_TYPES, row.actorType)
  ) {
    throw new RepositoryError('Unsupported Activity vocabulary stored in database.');
  }

  return {
    id: row.id,
    eventType: row.eventType as ActivityEventType,
    result: row.result as ActivityResult,
    severity: row.severity as ActivitySeverity,
    actor: {
      type: row.actorType as ActivityActorType,
      ...(row.actorId ? { id: row.actorId } : {}),
    },
    resource: {
      type: row.resourceType,
      id: row.resourceId,
      ...(row.companyId ? { companyId: row.companyId } : {}),
      ...(row.assessmentId ? { assessmentId: row.assessmentId } : {}),
    },
    ...(row.correlationId ? { correlationId: row.correlationId } : {}),
    message: row.message,
    createdAt: toIsoString(row.createdAt),
  };
};

export const appendActivity = async (
  db: ActivityRepositoryDb,
  input: AppendActivityInput,
): Promise<Activity> => {
  try {
    const activity = await db.activity.create({
      data: {
        id: generateId('activity'),
        entityType: input.resource.type,
        entityId: input.resource.id,
        action: input.eventType,
        eventType: input.eventType,
        result: input.result,
        severity: input.severity,
        actorType: input.actor.type,
        actorId: input.actor.id,
        resourceType: input.resource.type,
        resourceId: input.resource.id,
        companyId: input.resource.companyId,
        assessmentId: input.resource.assessmentId,
        correlationId: input.correlationId,
        message: input.message,
        createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
      },
      select: activitySelect,
    });

    return toActivity(activity);
  } catch (error) {
    throw mapPrismaError(error);
  }
};

export function createActivityRepository(
  db: ActivityRepositoryDb,
): ActivityRepository {
  const findMany = async (where: Record<string, unknown>, limit = 20) => {
    const activities = await db.activity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: normalizeLimit(limit, 20),
      select: activitySelect,
    });

    return activities.map(toActivity);
  };

  return {
    async findById(id) {
      const activity = await db.activity.findUnique({
        where: { id },
        select: activitySelect,
      });

      return activity ? toActivity(activity) : null;
    },

    findRecent(limit = 20) {
      return findMany({}, limit);
    },

    findByEntity(input) {
      return findMany(
        {
          resourceType: input.entityType,
          ...(input.entityId ? { resourceId: input.entityId } : {}),
        },
        input.limit,
      );
    },

    findByCompanyId(input) {
      return findMany({ companyId: input.companyId }, input.limit);
    },

    findByAssessmentId(input) {
      return findMany({ assessmentId: input.assessmentId }, input.limit);
    },

    append(input) {
      return appendActivity(db, input);
    },

    create(input) {
      return appendActivity(db, input);
    },
  };
}
