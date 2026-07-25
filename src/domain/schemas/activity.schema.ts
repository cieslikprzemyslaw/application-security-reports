import { z } from 'zod';

import type { Activity } from '../activity.js';

import {
  activityActorTypeSchema,
  activityEntityTypeSchema,
  activityEventTypeSchema,
  activityResultSchema,
  activitySeveritySchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  timestampSchema,
} from './common.schema.js';

export const activityActorSchema = z
  .object({
    type: activityActorTypeSchema,
    id: nonEmptyIdSchema.optional(),
  })
  .strict();

export const activityResourceSchema = z
  .object({
    type: activityEntityTypeSchema,
    id: nonEmptyIdSchema,
    companyId: nonEmptyIdSchema.optional(),
    assessmentId: nonEmptyIdSchema.optional(),
  })
  .strict();

export const activitySchema = z
  .object({
    id: nonEmptyIdSchema,
    eventType: activityEventTypeSchema,
    result: activityResultSchema,
    severity: activitySeveritySchema,
    actor: activityActorSchema,
    resource: activityResourceSchema,
    correlationId: nonEmptyIdSchema.optional(),
    message: nonEmptyTextSchema,
    createdAt: timestampSchema,
  })
  .strict();

type ActivitySchemaOutput = Required<z.output<typeof activitySchema>>;
const _activitySchemaCompatibilityCheck: ActivitySchemaOutput extends Activity
  ? true
  : never = true;

export const activityFileSchema = z.array(activitySchema);
