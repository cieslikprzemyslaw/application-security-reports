import { describe, expect, it, vi } from 'vitest';

import type {
  CreateReportVersionInput,
  ReportVersion,
} from '../../src/domain/report.js';
import { ValidationError } from '../../src/validation/index.js';
import { RepositoryConflictError } from '../database/errors.js';
import type {
  ReportVersionFinalisationTransactionRepositories,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';
import {
  assessment,
  company,
  createPreviewRepositories,
  evidence,
  previewRequest,
  report,
  settings,
  threat,
} from '../http/reports.preview.route.test/support.js';
import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';
import { ReportReadinessReportNotFoundError } from './report-readiness.service.js';
import {
  finaliseReportVersion,
  type FinaliseReportVersionDependencies,
} from './report-version-finalisation.service.js';

const readyThreat = {
  ...threat,
  impact: 'Customer data may be exposed.',
  recommendation: 'Apply object-level authorization.',
};

const buildVersion = (
  version: number,
  status: ReportVersion['status'] = 'draft',
): ReportVersion => ({
  id: `rvs_00000000-0000-0000-0000-${String(version).padStart(12, '0')}`,
  reportId: report.id,
  version,
  status,
  generatedAt: '2026-06-24',
  snapshot: buildReportPreviewSnapshotFixture(),
});

type PreviewOverrides = Parameters<typeof createPreviewRepositories>[0];

interface FinalisationHarnessOptions {
  preview?: PreviewOverrides;
  history?: ReportVersion[];
  createError?: Error;
  latestVersionUpdateError?: Error;
  transactionError?: Error;
}

const createFinalisationHarness = (
  options: FinalisationHarnessOptions = {},
) => {
  const preview = createPreviewRepositories({
    threat: readyThreat,
    ...options.preview,
  });
  let persisted = structuredClone(options.history ?? []);
  let latestVersion = report.latestVersion;

  const create = vi.fn(async (input: CreateReportVersionInput) => {
    if (options.createError) {
      throw options.createError;
    }

    const created: ReportVersion = {
      id: `rvs_00000000-0000-0000-0000-${String(input.version).padStart(12, '0')}`,
      ...structuredClone(input),
    };
    persisted.push(created);
    return structuredClone(created);
  });
  const findById = vi.fn(
    async (id: string) => persisted.find(item => item.id === id) ?? null,
  );
  const findByReportId = vi.fn(async () => structuredClone(persisted));
  const updateReportLatestVersion = vi.fn(
    async (_reportId: string, version: number) => {
      if (options.latestVersionUpdateError) {
        throw options.latestVersionUpdateError;
      }

      latestVersion = version;
    },
  );
  const transactionReportVersionRepository: ReportVersionTransactionRepository =
    {
      create,
      findById,
      findByReportId,
      updateReportLatestVersion,
    };
  const transactionRepositories: ReportVersionFinalisationTransactionRepositories =
    {
      ...preview.repositories,
      reportVersionRepository: transactionReportVersionRepository,
    };
  const withFinalisationTransactionCalls = vi.fn();
  const withFinalisationTransaction: FinaliseReportVersionDependencies['reportVersionRepository']['withFinalisationTransaction'] =
    async operation => {
      withFinalisationTransactionCalls();

      if (options.transactionError) {
        throw options.transactionError;
      }

      const versionsBefore = structuredClone(persisted);
      const latestVersionBefore = latestVersion;

      try {
        return await operation(transactionRepositories);
      } catch (error) {
        persisted = versionsBefore;
        latestVersion = latestVersionBefore;
        throw error;
      }
    };
  const dependencies: FinaliseReportVersionDependencies = {
    reportVersionRepository: { withFinalisationTransaction },
    now: () => new Date('2026-06-24T19:00:00.000Z'),
  };

  return {
    dependencies,
    create,
    findByReportId,
    updateReportLatestVersion,
    withFinalisationTransaction,
    withFinalisationTransactionCalls,
    persisted: () => structuredClone(persisted),
    latestVersion: () => latestVersion,
  };
};

const finalise = (
  dependencies: FinaliseReportVersionDependencies,
  request = previewRequest,
) =>
  finaliseReportVersion(
    {
      reportId: report.id,
      request,
      baseUrl: 'http://localhost:3001',
    },
    dependencies,
  );

describe('finaliseReportVersion', () => {
  it.each([
    { name: 'the first final', history: [], expected: 10 },
    {
      name: 'the next major final',
      history: [buildVersion(1), buildVersion(10, 'final'), buildVersion(11)],
      expected: 20,
    },
  ])(
    'creates $name with backend-owned numbering',
    async ({ history, expected }) => {
      const harness = createFinalisationHarness({ history });

      const result = await finalise(harness.dependencies);

      expect(result).toMatchObject({
        status: 'created',
        reportVersion: {
          version: expected,
          status: 'final',
          generatedAt: '2026-06-24',
        },
      });
      expect(harness.updateReportLatestVersion).toHaveBeenCalledWith(
        report.id,
        expected,
      );
      expect(harness.latestVersion()).toBe(expected);
    },
  );

  it('allows warning-only content without a client override', async () => {
    const harness = createFinalisationHarness();
    const warningOnlyRequest = {
      ...previewRequest,
      selection: {
        threatIds: [threat.id],
        evidenceIds: [],
      },
    };

    const result = await finalise(harness.dependencies, warningOnlyRequest);

    expect(result.status).toBe('created');
    expect(harness.create).toHaveBeenCalledOnce();
    expect(harness.persisted()[0]?.snapshot.warnings).toEqual([]);
  });

  it('returns structured blocking readiness errors and performs no writes', async () => {
    const harness = createFinalisationHarness({
      preview: { threat: { ...readyThreat, impact: undefined } },
    });

    const result = await finalise(harness.dependencies);

    expect(result).toMatchObject({
      status: 'blocked',
      readiness: {
        errors: [{ code: 'THREAT_IMPACT_REQUIRED' }],
      },
    });
    expect(harness.findByReportId).not.toHaveBeenCalled();
    expect(harness.create).not.toHaveBeenCalled();
    expect(harness.updateReportLatestVersion).not.toHaveBeenCalled();
    expect(harness.persisted()).toEqual([]);
    expect(harness.latestVersion()).toBe(0);
  });

  it('reuses readiness ownership and archived-state validation inside the transaction', async () => {
    const archivedHarness = createFinalisationHarness({
      preview: { report: { ...report, status: 'archived' } },
    });

    await expect(finalise(archivedHarness.dependencies)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(archivedHarness.create).not.toHaveBeenCalled();

    const ownershipHarness = createFinalisationHarness({
      preview: {
        report: {
          ...report,
          assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        },
      },
    });

    await expect(
      finalise(ownershipHarness.dependencies),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(ownershipHarness.create).not.toHaveBeenCalled();
  });

  it('uses the readiness missing-Report error and leaves persistence unchanged', async () => {
    const harness = createFinalisationHarness({ preview: { report: null } });

    await expect(finalise(harness.dependencies)).rejects.toBeInstanceOf(
      ReportReadinessReportNotFoundError,
    );
    expect(harness.create).not.toHaveBeenCalled();
    expect(harness.persisted()).toEqual([]);
  });

  it('rolls back the new version when updating Report.latestVersion fails', async () => {
    const failure = new Error('latestVersion update failed');
    const harness = createFinalisationHarness({
      latestVersionUpdateError: failure,
    });

    await expect(finalise(harness.dependencies)).rejects.toBe(failure);
    expect(harness.create).toHaveBeenCalledOnce();
    expect(harness.persisted()).toEqual([]);
    expect(harness.latestVersion()).toBe(0);
  });

  it('stores a new immutable snapshot without changing previous versions', async () => {
    const previous = buildVersion(1);
    const mutableThreat = { ...readyThreat };
    const harness = createFinalisationHarness({
      history: [previous],
      preview: { threat: mutableThreat },
    });

    const result = await finalise(harness.dependencies);
    mutableThreat.title = 'Changed after finalisation';
    previewRequest.selection.threatIds.push(
      'thr_00000000-0000-0000-0000-000000000099',
    );

    try {
      expect(result.status).toBe('created');
      expect(harness.persisted()[0]).toEqual(previous);
      expect(harness.persisted()[1]?.snapshot.selectedThreats[0]?.title).toBe(
        threat.title,
      );
      expect(harness.persisted()[1]?.snapshot.selection.threatIds).toEqual([
        threat.id,
      ]);
    } finally {
      previewRequest.selection.threatIds.pop();
    }
  });

  it('does not retry a concurrent version conflict as another major version', async () => {
    const conflict = new RepositoryConflictError();
    const harness = createFinalisationHarness({ transactionError: conflict });

    await expect(finalise(harness.dependencies)).rejects.toBe(conflict);
    expect(harness.withFinalisationTransactionCalls).toHaveBeenCalledOnce();
    expect(harness.create).not.toHaveBeenCalled();
  });

  it('resolves the complete final snapshot through transaction-bound repositories', async () => {
    const harness = createFinalisationHarness();

    const result = await finalise(harness.dependencies);

    expect(result.status).toBe('created');
    expect(harness.persisted()[0]?.snapshot).toMatchObject({
      company: { id: company.id },
      assessment: { id: assessment.id },
      branding: { issuerName: settings.organisationName },
      selectedThreats: [{ id: readyThreat.id }],
      selectedEvidence: [{ id: evidence.id }],
    });
  });
});
