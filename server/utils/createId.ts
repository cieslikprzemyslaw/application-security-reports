import { randomUUID } from 'node:crypto';
export type EntityPrefix = 'cmp' | 'asm' | 'thr' | 'evd' | 'rpt' | 'act';
export const createId = (prefix: EntityPrefix): string =>
  `${prefix}_${randomUUID()}`;
