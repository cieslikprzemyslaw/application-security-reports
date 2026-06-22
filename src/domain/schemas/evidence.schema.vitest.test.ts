import { describe, expect, it } from 'vitest';

import {
  createEvidenceRequestSchema,
  evidenceSchema,
  updateEvidenceRequestSchema,
} from './index.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';

const validEvidence = {
  id: evidenceId,
  assessmentId,
  threatIds: [threatId],
  type: 'note',
  title: 'Authorization reproduction',
  description: 'Observed request and response details.',
  content: 'GET /api/orders/2',
  capturedAt: '2026-06-22',
  createdAt: '2026-06-22T09:00:00.000Z',
  updatedAt: '2026-06-22T09:00:00.000Z',
};

describe('Evidence runtime schemas', () => {
  it('accepts domain, create, HTTP, and partial PATCH payloads', () => {
    expect(evidenceSchema.safeParse(validEvidence).success).toBe(true);
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [threatId],
        type: 'note',
        title: 'Authorization reproduction',
      }).success,
    ).toBe(true);
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'http',
        title: 'HTTP exchange',
        httpExchanges: [
          {
            request: { method: 'GET', url: '/api/orders/2' },
            response: { statusCode: 200 },
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      updateEvidenceRequestSchema.safeParse({
        title: 'Updated evidence',
      }).success,
    ).toBe(true);
  });

  it('requires the Assessment relationship on create and forbids moving it by PATCH', () => {
    expect(
      createEvidenceRequestSchema.safeParse({
        threatIds: [],
        type: 'note',
        title: 'Missing assessment',
      }).success,
    ).toBe(false);
    expect(
      updateEvidenceRequestSchema.safeParse({
        assessmentId,
      }).success,
    ).toBe(false);
  });

  it('rejects server-owned and unknown fields', () => {
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'note',
        title: 'Server-owned field',
        id: evidenceId,
      }).success,
    ).toBe(false);
    expect(
      evidenceSchema.safeParse({
        ...validEvidence,
        internalOnly: true,
      }).success,
    ).toBe(false);
  });

  it('enforces HTTP exchange rules', () => {
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'http',
        title: 'Missing exchanges',
      }).success,
    ).toBe(false);
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'note',
        title: 'Unexpected exchanges',
        httpExchanges: [
          {
            request: { method: 'GET', url: '/api/orders/2' },
            response: { statusCode: 200 },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      updateEvidenceRequestSchema.safeParse({
        type: 'text',
        httpExchanges: [],
      }).success,
    ).toBe(true);
  });

  it('rejects unsafe or inconsistent attachment metadata', () => {
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'file',
        title: 'Unsafe attachment',
        fileName: '../evidence.txt',
        mimeType: 'text/plain',
      }).success,
    ).toBe(false);
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'file',
        title: 'Wrong extension',
        fileName: 'evidence.png',
        mimeType: 'application/pdf',
      }).success,
    ).toBe(false);
    expect(
      createEvidenceRequestSchema.safeParse({
        assessmentId,
        threatIds: [],
        type: 'file',
        title: 'Too large',
        fileName: 'evidence.pdf',
        mimeType: 'application/pdf',
        attachmentSizeBytes: 5 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });

  it('requires a non-empty PATCH payload', () => {
    expect(updateEvidenceRequestSchema.safeParse({}).success).toBe(false);
  });
});
