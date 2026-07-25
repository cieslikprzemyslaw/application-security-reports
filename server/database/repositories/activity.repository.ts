import type {
  Activity,
  AppendActivityInput,
} from '../../../src/domain/activity.js';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTOR_TYPES,
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_RESULTS,
  ACTIVITY_SEVERITIES,
  type ActivityAction,
  type ActivityActorType,
  type ActivityEntityType,
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
  type ActivityCreateInput,
  type ActivityFindByEntityInput,
  type ActivityScopeQuery,
  type LegacyActivityCreateInput,
} from './repository.helpers.js';

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>;
  findRecent(limit?: number): Promise<Activity[]>;
  findByEntity(input: ActivityFindByEntityInput): Promise<Activity[]>;
  findByCompanyId(input: ActivityScopeQuery): Promise<Activity[]>;
  findByAssessmentId(input: ActivityScopeQuery): Promise<Activity[]>;
  append(input: AppendActivityInput): Promise<Activity>;
  create(input: ActivityCreateInput): Promise<Activity>;
}

type ActivityRepositoryDb = Pick<RepositoryClient, 'activity'>;

type ActivityRow = {
  id: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  action: string;
  eventType: string | null;
  result: string | null;
  severity: string | null;
  actorType: string | null;
  actorId: string | null;
  resourceType: ActivityEntityType | null;
  resourceId: string | null;
  companyId: string | null;
  assessmentId: string | null;
  correlationId: string | null;
  message: string;
  createdAt: Date;
};

const activitySelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
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

const legacyEventTypeByAction: Record<ActivityAction, ActivityEventType> = {
  created: 'legacy.created',
  updated: 'legacy.updated',
  deleted: 'legacy.deleted',
  'status-changed': 'legacy.status-changed',
  'evidence-added': 'legacy.evidence-added',
  'report-generated': 'legacy.report-generated',
};

const includes = <T extends string>(
  values: readonly T[],
  value: string,
): value is T => values.includes(value as T);

const toActivity = (row: ActivityRow): Activity => {
  const eventType =
    row.eventType && includes(ACTIVITY_EVENT_TYPES, row.eventType)
      ? row.eventType
      : includes(ACTIVITY_ACTIONS, row.action)
        ? legacyEventTypeByAction[row.action]
        : undefined;
  const result = row.result ?? 'success';
  const severity = row.severity ?? 'informational';
  const actorType = row.actorType ?? 'system';

  if (
    !eventType ||
    !includes(ACTIVITY_RESULTS, result) ||
    !includes(ACTIVITY_SEVERITIES, severity) ||
    !includes(ACTIVITY_ACTOR_TYPES, actorType)
  ) {
    throw new RepositoryError(
      'Unsupported Activity vocabulary stored in database.',
    );
  }

  const resourceType = row.resourceType ?? row.entityType;
  const resourceId = row.resourceId ?? row.entityId ?? row.id;

  return {
    id: row.id,
    eventType,
    result: result as ActivityResult,
    severity: severity as ActivitySeverity,
    actor: {
      type: actorType as ActivityActorType,
      ...(row.actorId ? { id: row.actorId } : {}),
    },
    resource: {
      type: resourceType,
      id: resourceId,
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

const toAppendInput = (input: ActivityCreateInput): AppendActivityInput => {
  if ('eventType' in input) {
    return input;
  }

  const legacyInput = input as LegacyActivityCreateInput;
  const id = legacyInput.entityId ?? 'legacy';

  return {
    eventType: legacyEventTypeByAction[legacyInput.action],
    result: 'success',
    severity: 'informational',
    actor: { type: 'system' },
    resource: {
      type: legacyInput.entityType,
      id,
      ...(legacyInput.entityType === 'company' ? { companyId: id } : {}),
      ...(legacyInput.entityType === 'assessment'
        ? { assessmentId: id }
        : {}),
    },
    message: legacyInput.message,
    createdAt: legacyInput.createdAt,
  };
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
      return appendActivity(db, toAppendInput(input));
    },
  };
}
