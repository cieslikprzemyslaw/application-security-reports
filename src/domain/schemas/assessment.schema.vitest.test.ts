import { describe, expect, it } from 'vitest';

import { OWASP_TOP_10_CURRENT_VERSION } from '../owaspTop10.js';
import { assessmentSchema } from './assessment.schema.js';
import {
  createAssessmentRequestSchema,
  updateAssessmentRequestSchema,
} from './request.schema.js';

const validPersistedAssessment = {
  id: 'asm_00000000-0000-0000-0000-000000000001',
  companyId: 'cmp_00000000-0000-0000-0000-000000000001',
  title: 'Customer Services Portal',
  description: 'Focused application security review',
  scope: 'Public web application',
  status: 'in-progress',
  startedAt: '2026-06-01',
  completedAt: '2026-06-10',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  assessmentType: 'Web application',
  overallRisk: 'high',
  owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-10T16:30:00.000Z',
};

const validCreateRequest = {
  companyId: validPersistedAssessment.companyId,
  title: validPersistedAssessment.title,
  description: validPersistedAssessment.description,
  scope: validPersistedAssessment.scope,
  status: 'draft',
  applicationName: validPersistedAssessment.applicationName,
  environment: validPersistedAssessment.environment,
  assessmentType: validPersistedAssessment.assessmentType,
  overallRisk: 'medium',
};

const expectInvalidAt = (
  result: {
    success: boolean;
    error?: {
      issues: Array<{
        path: Array<string | number>;
        message: string;
      }>;
    };
  },
  path: Array<string | number>,
) => {
  expect(result.success).toBe(false);

  if (result.success || !result.error) {
    return;
  }

  expect(result.error.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path,
      }),
    ]),
  );
};

describe('assessmentSchema', () => {
  it('accepts a complete persisted assessment', () => {
    expect(assessmentSchema.safeParse(validPersistedAssessment).success).toBe(
      true,
    );
  });

  it('accepts a historical null application name', () => {
    expect(
      assessmentSchema.safeParse({
        ...validPersistedAssessment,
        applicationName: null,
      }).success,
    ).toBe(true);
  });

  it('rejects unknown persisted fields', () => {
    const result = assessmentSchema.safeParse({
      ...validPersistedAssessment,
      unexpected: true,
    });

    expectInvalidAt(result, []);
  });

  it('rejects an unsupported OWASP taxonomy version', () => {
    const result = assessmentSchema.safeParse({
      ...validPersistedAssessment,
      owaspTaxonomyVersion: '2099',
    });

    expectInvalidAt(result, ['owaspTaxonomyVersion']);
  });

  it('rejects invalid status and calendar dates', () => {
    expectInvalidAt(
      assessmentSchema.safeParse({
        ...validPersistedAssessment,
        status: 'accepted-risk',
      }),
      ['status'],
    );

    expectInvalidAt(
      assessmentSchema.safeParse({
        ...validPersistedAssessment,
        completedAt: '2026-02-30',
      }),
      ['completedAt'],
    );
  });
});

describe('createAssessmentRequestSchema', () => {
  it('accepts the supported create contract', () => {
    expect(
      createAssessmentRequestSchema.safeParse(validCreateRequest).success,
    ).toBe(true);
  });

  it('requires a non-empty application name', () => {
    expectInvalidAt(
      createAssessmentRequestSchema.safeParse({
        ...validCreateRequest,
        applicationName: '   ',
      }),
      ['applicationName'],
    );
  });

  it('rejects server-owned and unknown fields', () => {
    expectInvalidAt(
      createAssessmentRequestSchema.safeParse({
        ...validCreateRequest,
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      }),
      [],
    );

    expectInvalidAt(
      createAssessmentRequestSchema.safeParse({
        ...validCreateRequest,
        unexpected: true,
      }),
      [],
    );
  });
});

describe('updateAssessmentRequestSchema', () => {
  it('accepts a supported partial update', () => {
    expect(
      updateAssessmentRequestSchema.safeParse({
        title: 'Updated assessment title',
        overallRisk: 'low',
      }).success,
    ).toBe(true);
  });

  it('rejects an empty update', () => {
    expectInvalidAt(updateAssessmentRequestSchema.safeParse({}), []);
  });

  it('rejects immutable, server-owned, and unknown fields', () => {
    expectInvalidAt(
      updateAssessmentRequestSchema.safeParse({
        companyId: validPersistedAssessment.companyId,
      }),
      [],
    );

    expectInvalidAt(
      updateAssessmentRequestSchema.safeParse({
        owaspTaxonomyVersion: OWASP_TOP_10_CURRENT_VERSION,
      }),
      [],
    );

    expectInvalidAt(
      updateAssessmentRequestSchema.safeParse({
        unexpected: true,
      }),
      [],
    );
  });
});
