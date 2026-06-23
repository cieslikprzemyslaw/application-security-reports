import { describe, expect, it, vi } from 'vitest';

import type { Assessment } from '../../src/domain/assessment.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type { ReportPreviewRequest } from '../../src/domain/report-preview.js';
import type { Threat } from '../../src/domain/threat.js';
import { RepositoryNotFoundError } from '../database/errors.js';
import {
  resolveReportPreviewSelectedRecords,
  type ReportPreviewSelectionRepositories,
} from './report-preview-selection.service.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const firstThreatId = 'thr_00000000-0000-0000-0000-000000000001';
const secondThreatId = 'thr_00000000-0000-0000-0000-000000000002';
const firstEvidenceId = 'evd_00000000-0000-0000-0000-000000000001';
const secondEvidenceId = 'evd_00000000-0000-0000-0000-000000000002';

const timestamp = '2026-06-23T12:00:00.000Z';

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

const buildThreat = (id: string, title: string): Threat => ({
  id,
  assessmentId,
  title,
  description: `${title} description`,
  severity: 'high',
  strideCategories: ['information-disclosure'],
  status: 'open',
  createdAt: timestamp,
  updatedAt: timestamp,
});

const buildEvidence = (id: string, title: string): Evidence => ({
  id,
  assessmentId,
  threatIds: [firstThreatId],
  type: 'note',
  title,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const firstThreat = buildThreat(firstThreatId, 'First threat');

const secondThreat = buildThreat(secondThreatId, 'Second threat');

const firstEvidence = buildEvidence(firstEvidenceId, 'First evidence');

const secondEvidence = buildEvidence(secondEvidenceId, 'Second evidence');

const buildRequest = (
  overrides: Partial<ReportPreviewRequest> = {},
): ReportPreviewRequest => ({
  companyId,
  assessmentId,
  selection: {
    threatIds: [secondThreatId, firstThreatId],
    evidenceIds: [secondEvidenceId, firstEvidenceId],
  },
  configuration: {},
  brandingMode: 'issuer',
  ...overrides,
});

const createRepositories = (
  overrides: Partial<ReportPreviewSelectionRepositories> = {},
) => {
  const assessmentRepository = {
    findById: vi.fn().mockResolvedValue(assessment),
  };

  const threatRepository = {
    findById: vi.fn().mockImplementation(async (id: string) => {
      if (id === firstThreatId) {
        return firstThreat;
      }

      if (id === secondThreatId) {
        return secondThreat;
      }

      return null;
    }),
  };

  const evidenceRepository = {
    findById: vi.fn().mockImplementation(async (id: string) => {
      if (id === firstEvidenceId) {
        return firstEvidence;
      }

      if (id === secondEvidenceId) {
        return secondEvidence;
      }

      return null;
    }),
  };

  return {
    assessmentRepository,
    threatRepository,
    evidenceRepository,
    repositories: {
      assessmentRepository,
      threatRepository,
      evidenceRepository,
      ...overrides,
    } satisfies ReportPreviewSelectionRepositories,
  };
};

describe('resolveReportPreviewSelectedRecords', () => {
  it('resolves the assessment and preserves exact selection order', async () => {
    const {
      repositories,
      assessmentRepository,
      threatRepository,
      evidenceRepository,
    } = createRepositories();

    await expect(
      resolveReportPreviewSelectedRecords(buildRequest(), repositories),
    ).resolves.toEqual({
      assessment,
      threats: [secondThreat, firstThreat],
      evidence: [secondEvidence, firstEvidence],
    });

    expect(assessmentRepository.findById).toHaveBeenCalledOnce();

    expect(assessmentRepository.findById).toHaveBeenCalledWith(assessmentId);

    expect(threatRepository.findById).toHaveBeenNthCalledWith(
      1,
      secondThreatId,
    );

    expect(threatRepository.findById).toHaveBeenNthCalledWith(2, firstThreatId);

    expect(evidenceRepository.findById).toHaveBeenNthCalledWith(
      1,
      secondEvidenceId,
    );

    expect(evidenceRepository.findById).toHaveBeenNthCalledWith(
      2,
      firstEvidenceId,
    );
  });

  it('allows empty threat and evidence selections', async () => {
    const { repositories, threatRepository, evidenceRepository } =
      createRepositories();

    const request = buildRequest({
      selection: {
        threatIds: [],
        evidenceIds: [],
      },
    });

    await expect(
      resolveReportPreviewSelectedRecords(request, repositories),
    ).resolves.toEqual({
      assessment,
      threats: [],
      evidence: [],
    });

    expect(threatRepository.findById).not.toHaveBeenCalled();

    expect(evidenceRepository.findById).not.toHaveBeenCalled();
  });

  it('returns an assessment-specific missing error', async () => {
    const { repositories, threatRepository, evidenceRepository } =
      createRepositories({
        assessmentRepository: {
          findById: vi.fn().mockResolvedValue(null),
        },
      });

    await expect(
      resolveReportPreviewSelectedRecords(buildRequest(), repositories),
    ).rejects.toMatchObject({
      name: 'RepositoryNotFoundError',
      message: 'Assessment not found.',
      resource: 'assessment',
    });

    expect(threatRepository.findById).not.toHaveBeenCalled();

    expect(evidenceRepository.findById).not.toHaveBeenCalled();
  });

  it('returns a threat-specific missing error before resolving evidence', async () => {
    const missingThreatId = 'thr_00000000-0000-0000-0000-000000000099';

    const { repositories, evidenceRepository } = createRepositories();

    const request = buildRequest({
      selection: {
        threatIds: [firstThreatId, missingThreatId],
        evidenceIds: [firstEvidenceId],
      },
    });

    await expect(
      resolveReportPreviewSelectedRecords(request, repositories),
    ).rejects.toMatchObject({
      name: 'RepositoryNotFoundError',
      message: 'Threat not found.',
      resource: 'threat',
    });

    expect(evidenceRepository.findById).not.toHaveBeenCalled();
  });

  it('returns an evidence-specific missing error', async () => {
    const missingEvidenceId = 'evd_00000000-0000-0000-0000-000000000099';

    const { repositories } = createRepositories();

    const request = buildRequest({
      selection: {
        threatIds: [firstThreatId],
        evidenceIds: [firstEvidenceId, missingEvidenceId],
      },
    });

    let caughtError: unknown;

    try {
      await resolveReportPreviewSelectedRecords(request, repositories);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(RepositoryNotFoundError);

    expect(caughtError).toMatchObject({
      name: 'RepositoryNotFoundError',
      message: 'Evidence not found.',
      resource: 'evidence',
    });
  });
});
