import { describe, expect, it } from 'vitest';

import {
  createDraftReportVersionRequestSchema,
  createFinalReportVersionRequestSchema,
  createReportRequestSchema,
  reportSchema,
  reportVersionListResponseSchema,
  reportVersionResponseSchema,
  reportVersionSchema,
  updateReportRequestSchema,
} from './index.js';

const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

const validReportVersionSnapshot = {
  company: {
    id: 'cmp_00000000-0000-0000-0000-000000000001',
    name: 'Northstar Digital',
    logoUrl: null,
  },
  assessment: {
    id: assessmentId,
    companyId: 'cmp_00000000-0000-0000-0000-000000000001',
    title: 'Customer Services Portal',
    applicationName: 'Customer Services Portal',
    status: 'in-progress',
    owaspTaxonomyVersion: '2025',
  },
  selection: { threatIds: [], evidenceIds: [] },
  configuration: { includeEvidence: false },
  branding: {
    brandingMode: 'issuer',
    companyName: 'Northstar Digital',
    companyLogoUrl: null,
    issuerLogoUrl: null,
  },
  selectedThreats: [],
  selectedEvidence: [],
  riskSummary: { threatCount: 0, evidenceCount: 0 },
  warnings: [],
};

describe('Report runtime schemas', () => {
  it('accepts domain, create, PATCH, and immutable version payloads', () => {
    expect(
      reportSchema.safeParse({
        id: 'rpt_00000000-0000-0000-0000-000000000001',
        assessmentId,
        title: 'Application Security Assessment',
        status: 'draft',
        selectedThreatIds: [threatId],
        latestVersion: 1,
        executiveSummary: 'Summary',
        createdAt: '2026-06-22T09:00:00.000Z',
        updatedAt: '2026-06-22T09:00:00.000Z',
      }).success,
    ).toBe(true);

    expect(
      createReportRequestSchema.safeParse({
        assessmentId,
        title: 'Application Security Assessment',
        selectedThreatIds: [threatId],
        executiveSummary: 'Summary',
      }).success,
    ).toBe(true);

    expect(
      updateReportRequestSchema.safeParse({
        title: 'Updated title',
        selectedThreatIds: [],
      }).success,
    ).toBe(true);

    expect(
      reportVersionSchema.safeParse({
        id: 'rvs_00000000-0000-0000-0000-000000000001',
        reportId: 'rpt_00000000-0000-0000-0000-000000000001',
        version: 1,
        status: 'draft',
        generatedAt: '2026-06-22',
        snapshot: validReportVersionSnapshot,
      }).success,
    ).toBe(true);

    expect(
      createDraftReportVersionRequestSchema.safeParse({
        companyId: validReportVersionSnapshot.company.id,
        assessmentId,
        selection: { threatIds: [], evidenceIds: [] },
        configuration: { includeEvidence: false },
        brandingMode: 'issuer',
      }).success,
    ).toBe(true);

    expect(
      createFinalReportVersionRequestSchema.safeParse({
        companyId: validReportVersionSnapshot.company.id,
        assessmentId,
        expectedLatestVersion: 0,
        selection: { threatIds: [], evidenceIds: [] },
        configuration: { includeEvidence: false },
        brandingMode: 'issuer',
      }).success,
    ).toBe(true);

    expect(
      reportVersionResponseSchema.safeParse({
        id: 'rvs_00000000-0000-0000-0000-000000000001',
        reportId: 'rpt_00000000-0000-0000-0000-000000000001',
        version: 1,
        status: 'draft',
        generatedAt: '2026-06-22',
        snapshot: validReportVersionSnapshot,
      }).success,
    ).toBe(true);

    expect(
      reportVersionListResponseSchema.safeParse([
        {
          id: 'rvs_00000000-0000-0000-0000-000000000001',
          reportId: 'rpt_00000000-0000-0000-0000-000000000001',
          version: 1,
          status: 'draft',
          generatedAt: '2026-06-22',
          snapshot: validReportVersionSnapshot,
        },
      ]).success,
    ).toBe(true);
  });

  it('rejects server-owned, unknown, and invalid fields', () => {
    expect(
      createDraftReportVersionRequestSchema.safeParse({
        companyId: validReportVersionSnapshot.company.id,
        assessmentId,
        selection: { threatIds: [], evidenceIds: [] },
        configuration: { includeEvidence: false },
        brandingMode: 'issuer',
        version: 99,
      }).success,
    ).toBe(false);

    expect(
      createFinalReportVersionRequestSchema.safeParse({
        companyId: validReportVersionSnapshot.company.id,
        assessmentId,
        selection: { threatIds: [], evidenceIds: [] },
        configuration: { includeEvidence: false },
        brandingMode: 'issuer',
      }).success,
    ).toBe(false);

    expect(
      createFinalReportVersionRequestSchema.safeParse({
        companyId: validReportVersionSnapshot.company.id,
        assessmentId,
        expectedLatestVersion: -1,
        selection: { threatIds: [], evidenceIds: [] },
        configuration: { includeEvidence: false },
        brandingMode: 'issuer',
      }).success,
    ).toBe(false);

    expect(
      createReportRequestSchema.safeParse({
        assessmentId,
        title: 'Server-owned status',
        selectedThreatIds: [],
        status: 'generated',
      }).success,
    ).toBe(false);
    expect(
      createReportRequestSchema.safeParse({
        assessmentId,
        title: 'Server-owned version',
        selectedThreatIds: [],
        latestVersion: 4,
      }).success,
    ).toBe(false);
    expect(
      reportSchema.safeParse({
        id: 'rpt_00000000-0000-0000-0000-000000000001',
        assessmentId,
        title: 'Invalid status',
        status: 'published',
        selectedThreatIds: [],
        latestVersion: 0,
        createdAt: '2026-06-22T09:00:00.000Z',
        updatedAt: '2026-06-22T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('rejects malformed public ReportVersion identifiers and internal paths', () => {
    const validResponse = {
      id: 'rvs_00000000-0000-0000-0000-000000000001',
      reportId: 'rpt_00000000-0000-0000-0000-000000000001',
      version: 1,
      status: 'draft',
      generatedAt: '2026-06-22',
      snapshot: validReportVersionSnapshot,
    };

    expect(
      reportVersionResponseSchema.safeParse({
        ...validResponse,
        id: 'wrong-id',
      }).success,
    ).toBe(false);
    expect(
      reportVersionResponseSchema.safeParse({
        ...validResponse,
        reportId: 'wrong-id',
      }).success,
    ).toBe(false);
    expect(
      reportVersionResponseSchema.safeParse({
        ...validResponse,
        filePath: '/private/report.json',
      }).success,
    ).toBe(false);
    expect(
      reportVersionListResponseSchema.safeParse([
        validResponse,
        { ...validResponse, id: 'wrong-id' },
      ]).success,
    ).toBe(false);
  });

  it('requires relationships and a non-empty PATCH', () => {
    expect(
      createReportRequestSchema.safeParse({
        title: 'Missing assessment',
        selectedThreatIds: [],
      }).success,
    ).toBe(false);
    expect(updateReportRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects malformed report snapshots', () => {
    expect(
      reportVersionSchema.safeParse({
        id: 'rvs_00000000-0000-0000-0000-000000000001',
        reportId: 'rpt_00000000-0000-0000-0000-000000000001',
        version: 1,
        status: 'draft',
        generatedAt: '2026-06-22',
        snapshot: {
          reportTitle: 'Application Security Assessment',
          companyName: 'Northstar Digital',
          assessmentTitle: 'Customer Services Portal',
          branding: {},
          threats: [],
        },
      }).success,
    ).toBe(false);
  });
});
