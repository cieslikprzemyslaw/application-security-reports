import { describe, expect, it, vi } from 'vitest';

import type { Assessment } from '../../src/domain/assessment.js';
import type { Company } from '../../src/domain/company.js';
import type { Evidence } from '../../src/domain/evidence.js';
import type {
  CreateReportVersionInput,
  Report,
  ReportVersion,
} from '../../src/domain/report.js';
import type { Settings } from '../../src/domain/settings.js';
import type { Threat } from '../../src/domain/threat.js';
import { ValidationError } from '../../src/validation/index.js';
import type {
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';
import {
  buildReportPreviewRequestFixture,
  buildReportPreviewSnapshotFixture,
  reportPreviewFixtureIds,
} from '../test/report-preview.fixture.js';
import {
  createDraftReportVersion,
  DraftReportNotFoundError,
  type CreateDraftReportVersionDependencies,
} from './report-version-draft.service.js';

const timestamp = '2026-06-24T09:00:00.000Z';
const { assessmentId, companyId, evidenceId, reportId, threatId } =
  reportPreviewFixtureIds;

const company: Company = {
  id: companyId,
  name: 'Northstar Digital',
  logoUrl: null,
  archivedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
};

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
  description: 'Object ownership is not enforced.',
  severity: 'high',
  strideCategories: ['elevation-of-privilege'],
  status: 'open',
  evidenceCount: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const evidence: Evidence = {
  id: evidenceId,
  assessmentId,
  threatIds: [threatId],
  type: 'note',
  title: 'Authorization evidence',
  content: 'Safe evidence content',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const settings: Settings = {
  id: 'set_00000000-0000-0000-0000-000000000001',
  organisationName: 'AppSec Consulting Ltd',
  defaultSeverity: 'medium',
  theme: 'system',
  dateFormat: 'YYYY-MM-DD',
  allowedBrandingModes: ['issuer', 'client'],
  defaultBrandingMode: 'issuer',
  createdAt: timestamp,
  updatedAt: timestamp,
};

const report: Report = {
  id: reportId,
  assessmentId,
  title: 'Application Security Assessment',
  status: 'draft',
  selectedThreatIds: [],
  latestVersion: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const buildVersion = (
  version: number,
  status: ReportVersion['status'] = 'draft',
): ReportVersion => ({
  id: `rvs_00000000-0000-0000-0000-${String(version).padStart(12, '0')}`,
  reportId,
  version,
  status,
  generatedAt: '2026-06-24',
  snapshot: buildReportPreviewSnapshotFixture(),
});

interface VersionRepositoryFakeOptions {
  history?: ReportVersion[];
  failLatestVersionUpdate?: Error;
  failRetention?: Error;
}

const createVersionRepositoryFake = (
  options: VersionRepositoryFakeOptions = {},
) => {
  let persisted = structuredClone(options.history ?? []);
  const create = vi.fn(async (input: CreateReportVersionInput) => {
    const created: ReportVersion = {
      id: `rvs_00000000-0000-0000-0000-${String(input.version).padStart(12, '0')}`,
      ...structuredClone(input),
    };
    persisted.push(created);
    return created;
  });
  const findById = vi.fn(
    async (id: string) => persisted.find(item => item.id === id) ?? null,
  );
  const findByReportId = vi.fn(async () => structuredClone(persisted));
  const updateReportLatestVersion = vi.fn(async () => {
    if (options.failLatestVersionUpdate) {
      throw options.failLatestVersionUpdate;
    }
  });
  const applyRetention = vi.fn(
    async (_reportId: string, currentVersion: number) => {
      if (options.failRetention) {
        throw options.failRetention;
      }

      persisted = persisted.filter(
        version =>
          version.status === 'final' || version.version === currentVersion,
      );
    },
  );
  const transactionRepository: ReportVersionTransactionRepository = {
    create,
    findById,
    findByReportId,
    applyRetention,
    updateReportLatestVersion,
    updateReportLatestVersionIfCurrent: vi.fn(async () => undefined),
  };
  const withTransactionCalls = vi.fn();
  const withTransaction: ReportVersionRepository['withTransaction'] =
    async operation => {
      withTransactionCalls();
      const before = structuredClone(persisted);

      try {
        return await operation(transactionRepository);
      } catch (error) {
        persisted = before;
        throw error;
      }
    };
  const withFinalisationTransaction: ReportVersionRepository['withFinalisationTransaction'] =
    async () => {
      throw new Error('Finalisation transaction is not used by draft tests.');
    };
  const repository: ReportVersionRepository = {
    ...transactionRepository,
    withTransaction,
    withFinalisationTransaction,
  };

  return {
    repository,
    create,
    findByReportId,
    updateReportLatestVersion,
    withTransactionCalls,
    persisted: () => structuredClone(persisted),
  };
};

const createDependencies = (
  options: {
    report?: Report | null;
    history?: ReportVersion[];
    failLatestVersionUpdate?: Error;
    failRetention?: Error;
  } = {},
) => {
  const versionRepository = createVersionRepositoryFake(options);
  const dependencies: CreateDraftReportVersionDependencies = {
    reportRepository: {
      findById: vi.fn(async () =>
        options.report === undefined ? report : options.report,
      ),
    },
    reportVersionRepository: versionRepository.repository,
    companyRepository: { findById: vi.fn(async () => company) },
    assessmentRepository: { findById: vi.fn(async () => assessment) },
    threatRepository: { findById: vi.fn(async () => threat) },
    evidenceRepository: { findById: vi.fn(async () => evidence) },
    settingsRepository: { get: vi.fn(async () => settings) },
    now: () => new Date('2026-06-24T12:34:56.000Z'),
  };

  return { dependencies, versionRepository };
};

const selectedRequest = buildReportPreviewRequestFixture({
  selection: { threatIds: [threatId], evidenceIds: [evidenceId] },
  configuration: { includeEvidence: true },
});

const createDraft = (dependencies: CreateDraftReportVersionDependencies) =>
  createDraftReportVersion(
    { reportId, request: selectedRequest, baseUrl: 'http://localhost:3001' },
    dependencies,
  );

describe('createDraftReportVersion', () => {
  it.each([
    { name: 'the first draft', history: [], expected: 1 },
    {
      name: 'a consecutive draft',
      history: [buildVersion(1)],
      expected: 2,
    },
    {
      name: 'a draft after final 1.0',
      history: [buildVersion(1), buildVersion(10, 'final')],
      expected: 11,
    },
    {
      name: 'a draft after retained v0.2 history',
      history: [buildVersion(2)],
      expected: 3,
    },
  ])(
    'creates $name with backend-owned numbering',
    async ({ history, expected }) => {
      const { dependencies, versionRepository } = createDependencies({
        history,
      });

      const created = await createDraft(dependencies);

      expect(created.version).toBe(expected);
      expect(created.status).toBe('draft');
      expect(created.generatedAt).toBe('2026-06-24');
      expect(created.filePath).toBeUndefined();
      expect(created.snapshot.reportTitle).toBe(report.title);
      expect(created.snapshot.selection).toEqual(selectedRequest.selection);
      expect(created.snapshot.selectedThreats[0]?.id).toBe(threatId);
      expect(created.snapshot.selectedEvidence[0]?.id).toBe(evidenceId);
      expect(versionRepository.updateReportLatestVersion).toHaveBeenCalledWith(
        reportId,
        expected,
      );
      expect(versionRepository.repository.applyRetention).toHaveBeenCalledWith(
        reportId,
        expected,
      );
    },
  );

  it('retains every final version and only the current draft after save', async () => {
    const { dependencies, versionRepository } = createDependencies({
      history: [
        buildVersion(1),
        buildVersion(10, 'final'),
        buildVersion(11),
        buildVersion(20, 'final'),
      ],
    });

    const created = await createDraft(dependencies);

    expect(created.version).toBe(21);
    expect(
      versionRepository
        .persisted()
        .map(version => [version.version, version.status]),
    ).toEqual([
      [10, 'final'],
      [20, 'final'],
      [21, 'draft'],
    ]);
  });

  it('allows an incomplete draft without applying a readiness gate', async () => {
    const { dependencies } = createDependencies();
    const request = buildReportPreviewRequestFixture();

    const created = await createDraftReportVersion(
      { reportId, request, baseUrl: 'http://localhost:3001' },
      dependencies,
    );

    expect(created.version).toBe(1);
    expect(created.snapshot.selectedThreats).toEqual([]);
    expect(created.snapshot.selectedEvidence).toEqual([]);
  });

  it('copies selected content into an immutable snapshot', async () => {
    const mutableThreat = { ...threat };
    const { dependencies } = createDependencies();
    dependencies.threatRepository.findById = vi.fn(async () => mutableThreat);

    const created = await createDraft(dependencies);
    mutableThreat.title = 'Changed after save';
    selectedRequest.selection.threatIds.push(
      'thr_00000000-0000-0000-0000-000000000099',
    );

    expect(created.snapshot.selectedThreats[0]?.title).toBe(
      'Missing authorization',
    );
    expect(created.snapshot.selection.threatIds).toEqual([threatId]);

    selectedRequest.selection.threatIds.pop();
  });

  it('rejects a missing Report before generating or persisting a snapshot', async () => {
    const { dependencies, versionRepository } = createDependencies({
      report: null,
    });

    await expect(createDraft(dependencies)).rejects.toBeInstanceOf(
      DraftReportNotFoundError,
    );
    expect(versionRepository.withTransactionCalls).not.toHaveBeenCalled();
  });

  it('rejects a request for another Assessment before persistence', async () => {
    const { dependencies, versionRepository } = createDependencies({
      report: {
        ...report,
        assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
      },
    });

    await expect(createDraft(dependencies)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(versionRepository.withTransactionCalls).not.toHaveBeenCalled();
  });

  it('rolls back the created version when the parent Report update fails', async () => {
    const failure = new Error('latest version update failed');
    const { dependencies, versionRepository } = createDependencies({
      failLatestVersionUpdate: failure,
    });

    await expect(createDraft(dependencies)).rejects.toBe(failure);
    expect(versionRepository.create).toHaveBeenCalledOnce();
    expect(versionRepository.persisted()).toEqual([]);
  });

  it('rolls back the created version when retention fails', async () => {
    const failure = new Error('retention failed');
    const { dependencies, versionRepository } = createDependencies({
      failRetention: failure,
    });

    await expect(createDraft(dependencies)).rejects.toBe(failure);
    expect(versionRepository.create).toHaveBeenCalledOnce();
    expect(versionRepository.updateReportLatestVersion).toHaveBeenCalledOnce();
    expect(versionRepository.persisted()).toEqual([]);
  });
});
