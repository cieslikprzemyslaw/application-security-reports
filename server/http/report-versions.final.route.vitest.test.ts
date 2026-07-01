import { createServer } from 'node:http';

import { describe, expect, it, vi } from 'vitest';

import type {
  CreateReportVersionInput,
  ReportVersion,
} from '../../src/domain/report.js';
import {
  reportReadinessResultSchema,
  reportVersionResponseSchema,
} from '../../src/domain/schemas/index.js';
import { loadServerConfig } from '../config.js';
import {
  RepositoryConflictError,
  RepositoryError,
} from '../database/errors.js';
import type {
  ReportVersionFinalisationTransactionRepositories,
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';
import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';
import { createApiApp } from './api-app.js';
import {
  createPreviewRepositories,
  previewRequest,
  report,
  threat,
} from './reports.preview.route.test/support.js';

const config = loadServerConfig({ FRONTEND_ORIGIN: 'http://localhost:5173' });
const readyThreat = {
  ...threat,
  impact: 'Customer data may be exposed.',
};

const buildVersion = (input: CreateReportVersionInput): ReportVersion => ({
  id: `rvs_00000000-0000-0000-0000-${String(input.version).padStart(12, '0')}`,
  ...structuredClone(input),
  filePath: 'C:\\private\\final-report.json',
});

type PreviewOverrides = Parameters<typeof createPreviewRepositories>[0];

const createFinalRepository = (
  options: {
    preview?: PreviewOverrides;
    transactionError?: Error;
  } = {},
) => {
  const preview = createPreviewRepositories({
    threat: readyThreat,
    ...options.preview,
  });
  let latestVersion = options.preview?.report?.latestVersion ?? 0;
  const history: ReportVersion[] = [];
  const create = vi.fn(async (input: CreateReportVersionInput) => {
    const created = buildVersion(input);
    history.push(created);
    return structuredClone(created);
  });
  const updateReportLatestVersionIfCurrent = vi.fn(
    async (
      _reportId: string,
      expectedLatestVersion: number,
      version: number,
    ) => {
      if (latestVersion !== expectedLatestVersion) {
        throw new RepositoryConflictError();
      }

      latestVersion = version;
    },
  );
  const transactionRepository: ReportVersionTransactionRepository = {
    create,
    findById: vi.fn(async id => history.find(item => item.id === id) ?? null),
    findByReportId: vi.fn(async () => structuredClone(history)),
    applyRetention: vi.fn(async () => undefined),
    updateReportLatestVersion: vi.fn(async (_reportId, version) => {
      latestVersion = version;
    }),
    updateReportLatestVersionIfCurrent,
  };
  const withFinalisationTransactionCalls = vi.fn();
  const withFinalisationTransaction: ReportVersionRepository['withFinalisationTransaction'] =
    async operation => {
      withFinalisationTransactionCalls();

      if (options.transactionError) {
        throw options.transactionError;
      }

      const reportRepository = {
        findById: async () => {
          const current =
            await preview.repositories.reportRepository.findById();
          return current ? { ...current, latestVersion } : null;
        },
      };
      const repositories: ReportVersionFinalisationTransactionRepositories = {
        ...preview.repositories,
        reportRepository,
        reportVersionRepository: transactionRepository,
      };

      return operation(repositories);
    };
  const repository: ReportVersionRepository = {
    ...transactionRepository,
    deleteByReportIdAndVersionId: vi.fn(async () => null),
    withTransaction: async () => {
      throw new Error('Draft transaction is not used by final routes.');
    },
    withFinalisationTransaction,
  };

  return {
    preview,
    repository,
    create,
    updateReportLatestVersionIfCurrent,
    withFinalisationTransactionCalls,
  };
};

const startFinalServer = async (
  options: {
    preview?: PreviewOverrides;
    transactionError?: Error;
  } = {},
) => {
  const final = createFinalRepository(options);
  const app = createApiApp(config, {
    ...final.preview.repositories,
    reportVersionRepository: final.repository,
  });
  const server = createServer(app);

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test server port.');
  }

  return {
    final,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

const postFinal = (
  baseUrl: string,
  body: unknown = { ...previewRequest, expectedLatestVersion: 0 },
  reportId: string = report.id,
) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/final`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/reports/:id/versions/final', () => {
  it('creates and returns the public final ReportVersion', async () => {
    const server = await startFinalServer();

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(201);

      const body = (await response.json()) as { data: unknown };
      const version = reportVersionResponseSchema.parse(body.data);

      expect(version.version).toBe(10);
      expect(version.status).toBe('final');
      expect(version.snapshot.selection).toEqual(previewRequest.selection);
      expect(JSON.stringify(body)).not.toContain('private');
      expect(server.final.create).toHaveBeenCalledOnce();
      expect(
        server.final.updateReportLatestVersionIfCurrent,
      ).toHaveBeenCalledWith(report.id, 0, 10, 'generated');
    } finally {
      await server.close();
    }
  });

  it('allows warning-only readiness without a client override', async () => {
    const server = await startFinalServer();

    try {
      const response = await postFinal(server.baseUrl, {
        ...previewRequest,
        expectedLatestVersion: 0,
        selection: {
          threatIds: previewRequest.selection.threatIds,
          evidenceIds: [],
        },
      });

      expect(response.status).toBe(201);
      expect(server.final.create).toHaveBeenCalledOnce();
    } finally {
      await server.close();
    }
  });

  it('returns structured readiness without creating a blocked final', async () => {
    const server = await startFinalServer({ preview: { threat } });

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(409);

      const body = (await response.json()) as {
        error: { code: string; details: unknown[] };
        readiness: unknown;
      };
      const readiness = reportReadinessResultSchema.parse(body.readiness);

      expect(body.error).toEqual({
        code: 'REPORT_FINALISATION_BLOCKED',
        message: 'Report is not ready for finalisation',
        details: [],
      });
      expect(readiness.errors.map(item => item.code)).toEqual([
        'THREAT_IMPACT_REQUIRED',
      ]);
      expect(server.final.create).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it.each([
    ['a missing expectedLatestVersion', previewRequest],
    [
      'backend-owned persistence fields',
      {
        ...previewRequest,
        expectedLatestVersion: 0,
        version: 20,
        status: 'final',
        snapshot: buildReportPreviewSnapshotFixture(),
      },
    ],
  ])('rejects %s before opening a transaction', async (_name, body) => {
    const server = await startFinalServer();

    try {
      const response = await postFinal(server.baseUrl, body);
      expect(response.status).toBe(400);
      expect(
        server.final.withFinalisationTransactionCalls,
      ).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('returns the stable missing Report error', async () => {
    const server = await startFinalServer({ preview: { report: null } });

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_NOT_FOUND' },
      });
    } finally {
      await server.close();
    }
  });

  it('maps Report ownership validation through the existing envelope', async () => {
    const server = await startFinalServer({
      preview: {
        report: {
          ...report,
          assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        },
      },
    });

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ path: 'assessmentId' }],
        },
      });
      expect(server.final.create).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('returns a stable conflict for stale version state', async () => {
    const server = await startFinalServer({
      preview: { report: { ...report, latestVersion: 10 } },
    });

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_CONFLICT' },
      });
      expect(server.final.create).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('returns a safe 500 without leaking repository details', async () => {
    const server = await startFinalServer({
      transactionError: new RepositoryError('private database detail'),
    });

    try {
      const response = await postFinal(server.baseUrl);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toMatchObject({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected server error',
        },
      });
      expect(JSON.stringify(body)).not.toContain('private database detail');
    } finally {
      await server.close();
    }
  });
});
