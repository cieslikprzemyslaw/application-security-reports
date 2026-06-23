import { describe, expect, it } from 'vitest';

import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { Threat } from '../../src/domain/threat.js';
import { ValidationError } from '../../src/validation/index.js';
import {
  validateReportPreviewSelectedRecords,
  type ResolvedReportPreviewRecords,
} from './report-preview-selection.service.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const otherCompanyId = 'cmp_00000000-0000-0000-0000-000000000002';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const otherAssessmentId = 'asm_00000000-0000-0000-0000-000000000002';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';
const secondThreatId = 'thr_00000000-0000-0000-0000-000000000002';
const evidenceId = 'evd_00000000-0000-0000-0000-000000000001';
const secondEvidenceId = 'evd_00000000-0000-0000-0000-000000000002';
const timestamp = '2026-06-23T12:00:00.000Z';

const buildRequest = (
  overrides: Partial<ReportPreviewRequest> = {},
): ReportPreviewRequest => ({
  companyId,
  assessmentId,
  selection: {
    threatIds: [threatId],
    evidenceIds: [evidenceId],
  },
  configuration: {},
  brandingMode: 'issuer',
  ...overrides,
});

const assessment: Assessment = {
  id: assessmentId,
  companyId,
  title: 'Customer Services Portal',
  status: 'in-progress',
  applicationName: 'Customer Services Portal',
  owaspTaxonomyVersion: '2025',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const threat: Threat = {
  id: threatId,
  assessmentId,
  title: 'Missing authorization',
  description: 'The endpoint does not enforce object ownership.',
  severity: 'high',
  strideCategories: ['elevation-of-privilege'],
  status: 'open',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const evidence: Evidence = {
  id: evidenceId,
  assessmentId,
  threatIds: [threatId],
  type: 'note',
  title: 'Authorization evidence',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const buildRecords = (
  overrides: Partial<ResolvedReportPreviewRecords> = {},
): ResolvedReportPreviewRecords => ({
  assessment,
  threats: [threat],
  evidence: [evidence],
  ...overrides,
});

const expectValidationFields = (
  callback: () => unknown,
  expectedFields: Array<{ path: string; message: string }>,
) => {
  let caughtError: unknown;

  try {
    callback();
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ValidationError);
  expect(caughtError).toMatchObject({
    response: {
      error: 'VALIDATION_ERROR',
      fields: expectedFields,
    },
  });
};

describe('validateReportPreviewSelectedRecords', () => {
  it('rejects an Assessment that belongs to another Company', () => {
    expectValidationFields(
      () =>
        validateReportPreviewSelectedRecords(
          buildRequest(),
          buildRecords({
            assessment: { ...assessment, companyId: otherCompanyId },
          }),
        ),
      [
        {
          path: 'companyId',
          message: 'Assessment does not belong to the requested Company.',
        },
      ],
    );
  });

  it('rejects a mismatched Assessment and every invalid child relationship', () => {
    expectValidationFields(
      () =>
        validateReportPreviewSelectedRecords(
          buildRequest(),
          buildRecords({
            assessment: { ...assessment, id: otherAssessmentId },
          }),
        ),
      [
        {
          path: 'assessmentId',
          message:
            'Resolved Assessment does not match the requested Assessment.',
        },
        {
          path: 'selection.threatIds.0',
          message: 'Threat does not belong to the selected Assessment.',
        },
        {
          path: 'selection.evidenceIds.0',
          message: 'Evidence does not belong to the selected Assessment.',
        },
      ],
    );
  });

  it('rejects every Threat outside the selected Assessment', () => {
    const secondThreat: Threat = {
      ...threat,
      id: secondThreatId,
      assessmentId: otherAssessmentId,
    };

    expectValidationFields(
      () =>
        validateReportPreviewSelectedRecords(
          buildRequest({
            selection: {
              threatIds: [threatId, secondThreatId],
              evidenceIds: [evidenceId],
            },
          }),
          buildRecords({
            threats: [threat, secondThreat],
          }),
        ),
      [
        {
          path: 'selection.threatIds.1',
          message: 'Threat does not belong to the selected Assessment.',
        },
      ],
    );
  });

  it('rejects every Evidence record outside the selected Assessment', () => {
    const secondEvidence: Evidence = {
      ...evidence,
      id: secondEvidenceId,
      assessmentId: otherAssessmentId,
    };

    expectValidationFields(
      () =>
        validateReportPreviewSelectedRecords(
          buildRequest({
            selection: {
              threatIds: [threatId],
              evidenceIds: [evidenceId, secondEvidenceId],
            },
          }),
          buildRecords({
            evidence: [evidence, secondEvidence],
          }),
        ),
      [
        {
          path: 'selection.evidenceIds.1',
          message: 'Evidence does not belong to the selected Assessment.',
        },
      ],
    );
  });

  it('rejects an archived Assessment', () => {
    expectValidationFields(
      () =>
        validateReportPreviewSelectedRecords(
          buildRequest(),
          buildRecords({
            assessment: { ...assessment, status: 'archived' },
          }),
        ),
      [
        {
          path: 'assessmentId',
          message: 'Archived Assessments are not selectable.',
        },
      ],
    );
  });

  it('returns the valid resolved selection unchanged', () => {
    const records = buildRecords();

    expect(validateReportPreviewSelectedRecords(buildRequest(), records)).toBe(
      records,
    );
  });
});
