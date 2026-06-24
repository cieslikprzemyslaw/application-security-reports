import { createServer } from 'node:http';

import { describe, expect, it, vi } from 'vitest';

import type {
  CreateReportVersionInput,
  ReportVersion,
} from '../../src/domain/report.js';
import { reportVersionResponseSchema } from '../../src/domain/schemas/index.js';
import { loadServerConfig } from '../config.js';
import { RepositoryConflictError } from '../database/errors.js';
import type {
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';
import {
  buildReportPreviewSnapshotFixture,
  reportPreviewFixtureIds,
} from '../test/report-preview.fixture.js';
import { createApiApp } from './api-app.js';
import {
  createPreviewRepositories,
  previewRequest,
} from './reports.preview.route.test/support.js';

const config = loadServerConfig({ FRONTEND_ORIGIN: 'http://localhost:5173' });
const { reportId } = reportPreviewFixtureIds;

const buildVersion = (
  version: number,
  status: ReportVersion['status'] = 'draft',
): ReportVersion => ({
  id: `rvs_00000000-0000-0000-0000-${String(version).padStart(12, '0')}`,
  reportId,
  version,
  status,
  generatedAt: '2026-06-24',
  filePath: 'C:\\private\\report.json',
  snapshot: buildReportPreviewSnapshotFixture(),
});

const createVersionRepository = (
  options: {
    history?: ReportVersion[];
    transactionError?: Error;
  } = {},
) => {
  const history = [...(options.history ?? [])];
  const create = vi.fn(async (input: CreateReportVersionInput) => ({
    id: `rvs_00000000-0000-0000-0000-${String(input.version).padStart(12, '0')}`,
    ...structuredClone(input),
    filePath: 'C:\\private\\report.json',
  }));
  const transactionRepository: ReportVersionTransactionRepository = {
    create,
    findById: vi.fn(async () => null),
    findByReportId: vi.fn(async () => structuredClone(history)),
    updateReportLatestVersion: vi.fn(async () => undefined),
    updateReportLatestVersionIfCurrent: vi.fn(async () => undefined),
  };
  const withTransactionCalls = vi.fn();
  const withTransaction: ReportVersionRepository['withTransaction'] =
    async operation => {
      withTransactionCalls();

      if (options.transactionError) {
        throw options.transactionError;
      }

      return operation(transactionRepository);
    };
  const withFinalisationTransaction: ReportVersionRepository['withFinalisationTransaction'] =
    async () => {
      throw new Error('Finalisation transaction is not used by draft routes.');
    };
  const repository: ReportVersionRepository = {
    ...transactionRepository,
    withTransaction,
    withFinalisationTransaction,
  };

  return { repository, create, withTransactionCalls };
};

const startDraftServer = async (
  options: {
    reportMissing?: boolean;
    history?: ReportVersion[];
    transactionError?: Error;
  } = {},
) => {
  const preview = createPreviewRepositories();
  const version = createVersionRepository(options);

  const reportRepository = options.reportMissing
    ? {
        ...preview.repositories.reportRepository,
        findById: vi.fn(async () => null),
      }
    : preview.repositories.reportRepository;

  const app = createApiApp(config, {
    ...preview.repositories,
    reportRepository,
    reportVersionRepository: version.repository,
  });
  const server = createServer(app);

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test server port.');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    version,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

const postDraft = (baseUrl: string, body: unknown = previewRequest) =>
  fetch(`${baseUrl}/api/reports/${reportId}/versions/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/reports/:id/versions/draft', () => {
  it('creates and returns the next public draft ReportVersion', async () => {
    const server = await startDraftServer();

    try {
      const response = await postDraft(server.baseUrl);
      expect(response.status).toBe(201);

      const body = (await response.json()) as { data: unknown };
      const version = reportVersionResponseSchema.parse(body.data);

      expect(version.version).toBe(1);
      expect(version.status).toBe('draft');
      expect(version.snapshot.selection).toEqual(previewRequest.selection);
      expect(JSON.stringify(body)).not.toContain('private');
      expect(server.version.create).toHaveBeenCalledOnce();
    } finally {
      await server.close();
    }
  });

  it('rejects client-owned version, status, and snapshot fields before persistence', async () => {
    const server = await startDraftServer();

    try {
      const response = await postDraft(server.baseUrl, {
        ...previewRequest,
        version: 99,
        status: 'final',
        snapshot: buildReportPreviewSnapshotFixture(),
      });

      expect(response.status).toBe(400);
      expect(server.version.withTransactionCalls).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('returns the stable missing Report error', async () => {
    const server = await startDraftServer({ reportMissing: true });

    try {
      const response = await postDraft(server.baseUrl);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_NOT_FOUND' },
      });
      expect(server.version.withTransactionCalls).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('returns a safe conflict when concurrent persistence rejects the version', async () => {
    const server = await startDraftServer({
      transactionError: new RepositoryConflictError(),
    });

    try {
      const response = await postDraft(server.baseUrl);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_CONFLICT' },
      });
    } finally {
      await server.close();
    }
  });

  it('keeps finalisation possible but rejects a tenth draft minor', async () => {
    const history = Array.from({ length: 9 }, (_, index) =>
      buildVersion(index + 1),
    );
    const server = await startDraftServer({ history });

    try {
      const response = await postDraft(server.baseUrl);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_VERSION_SEQUENCE_EXHAUSTED' },
      });
      expect(server.version.create).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });
});
