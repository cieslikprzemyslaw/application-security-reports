import { randomUUID } from 'node:crypto';

/**
 * Backend-generated identifiers use `<prefix><UUID>` and are assigned before
 * persistence.
 */
const ENTITY_PREFIXES = {
  company: 'cmp_',
  assessment: 'asm_',
  threat: 'thr_',
  evidence: 'evd_',
  report: 'rpt_',
  activity: 'act_',
  settings: 'set_',
} as const;

export type EntityType = keyof typeof ENTITY_PREFIXES;

const isEntityType = (value: string): value is EntityType =>
  value in ENTITY_PREFIXES;

export function generateId(entityType: EntityType): string;
export function generateId(entityType: string): string {
  if (!isEntityType(entityType)) {
    throw new Error(`Unsupported entity type for ID generation: ${entityType}`);
  }

  return `${ENTITY_PREFIXES[entityType]}${randomUUID()}`;
}
