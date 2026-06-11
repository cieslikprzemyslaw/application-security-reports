import { z } from 'zod';

import type { Activity } from '../activity.js';

import {
  activityActionSchema,
  activityEntityTypeSchema,
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  timestampSchema,
} from './common.schema.js';

export const activitySchema = z
  .object({
    id: nonEmptyIdSchema,
    entityType: activityEntityTypeSchema,
    entityId: nonEmptyIdSchema.optional(),
    action: activityActionSchema,
    message: nonEmptyTextSchema,
    createdAt: timestampSchema,
  })
  .strict();

type ActivitySchemaOutput = Required<z.output<typeof activitySchema>>;
const _activitySchemaCompatibilityCheck: ActivitySchemaOutput extends Activity
  ? true
  : never = true;

export const activityFileSchema = z.array(activitySchema);
