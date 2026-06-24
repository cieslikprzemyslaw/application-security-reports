import { describe, expect, it } from 'vitest';

import {
  REPORT_READINESS_CODES,
  reportReadinessErrorItemSchema,
  reportReadinessItemSchema,
  reportReadinessResultSchema,
  reportReadinessTargetSchema,
  reportReadinessWarningItemSchema,
} from './report-readiness.schema.js';

const reportId = 'rpt_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const blockingItem = {
  code: 'THREAT_IMPACT_REQUIRED',
  message: 'Threat impact is required before finalisation.',
  target: {
    resourceType: 'threat',
    resourceId: threatId,
    field: 'impact',
  },
} as const;

const warningItem = {
  code: 'EVIDENCE_SELECTION_EMPTY',
  message: 'No Evidence is selected for inclusion in the report.',
  target: {
    resourceType: 'report',
    resourceId: reportId,
    field: 'selection.evidenceIds',
  },
} as const;

describe('report readiness runtime schemas', () => {
  it('accepts empty, blocking, warning-only, and mixed results', () => {
    expect(
      reportReadinessResultSchema.safeParse({ errors: [], warnings: [] })
        .success,
    ).toBe(true);
    expect(
      reportReadinessResultSchema.safeParse({
        errors: [blockingItem],
        warnings: [],
      }).success,
    ).toBe(true);
    expect(
      reportReadinessResultSchema.safeParse({
        errors: [],
        warnings: [warningItem],
      }).success,
    ).toBe(true);
    expect(
      reportReadinessResultSchema.safeParse({
        errors: [blockingItem],
        warnings: [warningItem],
      }).success,
    ).toBe(true);
  });

  it('accepts every stable readiness code', () => {
    for (const code of REPORT_READINESS_CODES) {
      expect(
        reportReadinessItemSchema.safeParse({
          ...blockingItem,
          code,
        }).success,
      ).toBe(true);
    }
  });

  it('enforces blocking and warning code classification', () => {
    expect(reportReadinessErrorItemSchema.safeParse(warningItem).success).toBe(
      false,
    );
    expect(
      reportReadinessWarningItemSchema.safeParse(blockingItem).success,
    ).toBe(false);
  });

  it('rejects unknown fields, codes, and empty messages', () => {
    expect(
      reportReadinessResultSchema.safeParse({
        errors: [],
        warnings: [],
        isReady: true,
      }).success,
    ).toBe(false);
    expect(
      reportReadinessItemSchema.safeParse({
        ...blockingItem,
        code: 'UNKNOWN_READINESS_CODE',
      }).success,
    ).toBe(false);
    expect(
      reportReadinessItemSchema.safeParse({
        ...blockingItem,
        message: ' ',
      }).success,
    ).toBe(false);
    expect(
      reportReadinessItemSchema.safeParse({
        ...blockingItem,
        internalPath: '/private/report.json',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid resource types, malformed IDs, and mismatched prefixes', () => {
    expect(
      reportReadinessTargetSchema.safeParse({
        resourceType: 'settings',
        resourceId: 'set_00000000-0000-0000-0000-000000000001',
      }).success,
    ).toBe(false);
    expect(
      reportReadinessTargetSchema.safeParse({
        resourceType: 'threat',
        resourceId: 'thr_not-a-uuid',
      }).success,
    ).toBe(false);
    expect(
      reportReadinessTargetSchema.safeParse({
        resourceType: 'threat',
        resourceId: reportId,
      }).success,
    ).toBe(false);
    expect(
      reportReadinessTargetSchema.safeParse({
        resourceType: 'report',
        resourceId: reportId,
        field: '',
      }).success,
    ).toBe(false);
  });
});
