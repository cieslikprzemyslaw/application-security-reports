import { describe, expect, it } from 'vitest';

import {
  createThreatOwaspCategoryCodeSchema,
  createThreatRequestSchema,
  threatSchema,
  updateThreatRequestSchema,
} from './index.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const validThreat = {
  id: threatId,
  assessmentId,
  title: 'Missing object-level authorization',
  description: 'Another customer record can be loaded.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
  affectedEndpoint: '/api/orders/{id}',
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-10T16:30:00.000Z',
};

const validCreateRequest = {
  assessmentId,
  title: 'Missing object-level authorization',
  description: 'Another customer record can be loaded.',
  severity: 'high',
  strideCategories: ['spoofing'],
  status: 'open',
  owaspCategoryCode: 'A01:2025',
};

describe('Threat runtime schemas', () => {
  it('accepts current domain, create, and partial PATCH payloads', () => {
    expect(threatSchema.safeParse(validThreat).success).toBe(true);
    expect(
      createThreatRequestSchema.safeParse(validCreateRequest).success,
    ).toBe(true);
    expect(
      updateThreatRequestSchema.safeParse({
        title: 'Updated threat title',
        severity: 'critical',
      }).success,
    ).toBe(true);
  });

  it('requires the Assessment relationship on create and forbids moving it by PATCH', () => {
    const { assessmentId: _assessmentId, ...withoutAssessment } =
      validCreateRequest;

    expect(createThreatRequestSchema.safeParse(withoutAssessment).success).toBe(
      false,
    );
    expect(
      updateThreatRequestSchema.safeParse({
        assessmentId: 'asm_00000000-0000-0000-0000-000000000002',
      }).success,
    ).toBe(false);
  });

  it('rejects empty and invalid Threat fields', () => {
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        title: '   ',
      }).success,
    ).toBe(false);
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        strideCategories: [],
      }).success,
    ).toBe(false);
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        severity: 'extreme',
      }).success,
    ).toBe(false);
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        status: 'accepted',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown and server-owned fields', () => {
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        id: threatId,
      }).success,
    ).toBe(false);
    expect(
      createThreatRequestSchema.safeParse({
        ...validCreateRequest,
        owaspTaxonomyVersion: '2021',
      }).success,
    ).toBe(false);
    expect(
      threatSchema.safeParse({
        ...validThreat,
        internalOnly: true,
      }).success,
    ).toBe(false);
  });

  it('requires a non-empty PATCH payload', () => {
    expect(updateThreatRequestSchema.safeParse({}).success).toBe(false);
  });

  it('validates OWASP category codes against the Assessment taxonomy version', () => {
    const schema = createThreatOwaspCategoryCodeSchema('2025');

    expect(schema.safeParse('A01:2025').success).toBe(true);
    expect(schema.safeParse('custom').success).toBe(true);
    expect(schema.safeParse('A01:2021').success).toBe(false);
  });
});
