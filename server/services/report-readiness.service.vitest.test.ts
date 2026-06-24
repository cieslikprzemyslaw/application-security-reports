import { describe, expect, it } from 'vitest';

import type { Report } from '../../src/domain/report.js';
import type { ReportPreviewSnapshot } from '../../src/domain/report-preview.js';
import {
  buildReportPreviewSnapshotFixture,
  reportPreviewFixtureIds,
} from '../test/report-preview.fixture.js';
import { classifyReportReadiness } from './report-readiness.service.js';

const timestamp = '2026-06-24T12:00:00.000Z';

const buildReport = (overrides: Partial<Report> = {}): Report => ({
  id: reportPreviewFixtureIds.reportId,
  assessmentId: reportPreviewFixtureIds.assessmentId,
  title: 'Application Security Assessment',
  status: 'draft',
  selectedThreatIds: [reportPreviewFixtureIds.threatId],
  latestVersion: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});

const buildCompleteSnapshot = (
  overrides: Partial<ReportPreviewSnapshot> = {},
): ReportPreviewSnapshot =>
  buildReportPreviewSnapshotFixture({
    selection: {
      threatIds: [reportPreviewFixtureIds.threatId],
      evidenceIds: [reportPreviewFixtureIds.evidenceId],
    },
    configuration: {
      includeEvidence: true,
    },
    branding: {
      brandingMode: 'issuer',
      companyName: 'Northstar Digital',
      companyLogoUrl: null,
      issuerName: 'AppSec Consulting Ltd',
      issuerLogoUrl: null,
    },
    selectedThreats: [
      {
        id: reportPreviewFixtureIds.threatId,
        assessmentId: reportPreviewFixtureIds.assessmentId,
        title: 'Missing authorization',
        description: 'Object ownership is not enforced.',
        severity: 'high',
        strideCategories: ['elevation-of-privilege'],
        status: 'open',
        impact: 'Another customer record can be accessed.',
        recommendation: 'Enforce object-level authorization.',
      },
    ],
    selectedEvidence: [
      {
        id: reportPreviewFixtureIds.evidenceId,
        assessmentId: reportPreviewFixtureIds.assessmentId,
        threatIds: [reportPreviewFixtureIds.threatId],
        type: 'note',
        title: 'Authorization evidence',
        httpExchanges: [],
      },
    ],
    riskSummary: {
      overallRisk: 'high',
      threatCount: 1,
      evidenceCount: 1,
    },
    ...overrides,
  });

describe('classifyReportReadiness', () => {
  it('returns empty collections for complete input', () => {
    expect(
      classifyReportReadiness({
        report: buildReport(),
        snapshot: buildCompleteSnapshot(),
      }),
    ).toEqual({ errors: [], warnings: [] });
  });

  it('returns every blocking code in deterministic order and trims values', () => {
    const snapshot = buildCompleteSnapshot({
      branding: {
        ...buildCompleteSnapshot().branding,
        issuerName: ' ',
      },
      selectedThreats: [
        {
          ...buildCompleteSnapshot().selectedThreats[0]!,
          description: ' ',
          impact: undefined,
          recommendation: ' ',
        },
      ],
    });

    const result = classifyReportReadiness({
      report: buildReport({ title: ' ' }),
      snapshot,
    });

    expect(result.errors.map(item => item.code)).toEqual([
      'REPORT_TITLE_REQUIRED',
      'THREAT_DESCRIPTION_REQUIRED',
      'THREAT_IMPACT_REQUIRED',
      'THREAT_RECOMMENDATION_REQUIRED',
      'ISSUER_NAME_REQUIRED',
    ]);
    expect(result.errors.map(item => item.target)).toEqual([
      {
        resourceType: 'report',
        resourceId: reportPreviewFixtureIds.reportId,
        field: 'title',
      },
      {
        resourceType: 'threat',
        resourceId: reportPreviewFixtureIds.threatId,
        field: 'description',
      },
      {
        resourceType: 'threat',
        resourceId: reportPreviewFixtureIds.threatId,
        field: 'impact',
      },
      {
        resourceType: 'threat',
        resourceId: reportPreviewFixtureIds.threatId,
        field: 'recommendation',
      },
      {
        resourceType: 'report',
        resourceId: reportPreviewFixtureIds.reportId,
        field: 'brandingMode',
      },
    ]);
  });

  it('requires at least one selected Threat', () => {
    const result = classifyReportReadiness({
      report: buildReport(),
      snapshot: buildReportPreviewSnapshotFixture({
        configuration: { includeEvidence: false },
        branding: {
          brandingMode: 'issuer',
          companyName: 'Northstar Digital',
          companyLogoUrl: null,
          issuerName: 'AppSec Consulting Ltd',
          issuerLogoUrl: null,
        },
      }),
    });

    expect(result.errors.map(item => item.code)).toEqual([
      'THREAT_SELECTION_REQUIRED',
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('returns evidence warnings without blocking finalisation', () => {
    const result = classifyReportReadiness({
      report: buildReport(),
      snapshot: buildCompleteSnapshot({
        selection: {
          threatIds: [reportPreviewFixtureIds.threatId],
          evidenceIds: [],
        },
        selectedEvidence: [],
        riskSummary: {
          overallRisk: 'high',
          threatCount: 1,
          evidenceCount: 0,
        },
      }),
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings.map(item => item.code)).toEqual([
      'EVIDENCE_SELECTION_EMPTY',
      'THREAT_EVIDENCE_MISSING',
    ]);
  });

  it('does not emit Evidence warnings when Evidence is disabled', () => {
    const result = classifyReportReadiness({
      report: buildReport(),
      snapshot: buildCompleteSnapshot({
        selection: {
          threatIds: [reportPreviewFixtureIds.threatId],
          evidenceIds: [],
        },
        configuration: { includeEvidence: false },
        selectedEvidence: [],
        riskSummary: {
          overallRisk: 'high',
          threatCount: 1,
          evidenceCount: 0,
        },
      }),
    });

    expect(result).toEqual({ errors: [], warnings: [] });
  });

  it('accepts client branding without an issuer name', () => {
    const result = classifyReportReadiness({
      report: buildReport(),
      snapshot: buildCompleteSnapshot({
        branding: {
          ...buildCompleteSnapshot().branding,
          brandingMode: 'client',
          issuerName: undefined,
        },
      }),
    });

    expect(result.errors).toEqual([]);
  });
});
