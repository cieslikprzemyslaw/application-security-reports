import type { AppendActivityInput } from '../../../src/domain/activity.js';
import type {
  ActivityAction,
  ActivityEntityType,
  ISODateString,
} from '../../../src/domain/common.js';

export const toOptionalText = (
  value: string | null | undefined,
): string | undefined => value ?? undefined;

export const toIsoString = (value: Date): ISODateString => value.toISOString();

export const dedupeStrings = (values: readonly string[]): string[] =>
  Array.from(new Set(values));

export const normalizeLimit = (
  value: number | undefined,
  fallback: number,
  minimum = 1,
  maximum = 100,
): number => {
  const candidate = Number.isFinite(value ?? Number.NaN)
    ? Math.trunc(value ?? fallback)
    : fallback;

  return Math.min(maximum, Math.max(minimum, candidate));
};

export type LegacyActivityCreateInput = {
  entityType: ActivityEntityType;
  entityId?: string;
  action: ActivityAction;
  message: string;
  createdAt?: ISODateString;
};

export type ActivityCreateInput =
  | AppendActivityInput
  | LegacyActivityCreateInput;

export type ActivityFindByEntityInput = {
  entityType: ActivityEntityType;
  entityId?: string;
  limit?: number;
};

export type ActivityScopeQuery = {
  companyId?: string;
  assessmentId?: string;
  limit?: number;
};
