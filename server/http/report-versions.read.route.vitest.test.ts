import { createServer } from 'node:http';

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type {
  CreateReportVersionInput,
  ReportVersion,
} from '../../src/domain/report.js';
import { reportVersionResponseSchema } from '../../src/domain/schemas/index.js';
import { loadServerConfig } from '../config.js';
import { RepositoryError } from '../database/errors.js';
import type {
  ReportVersionRepository,
  ReportVersionTransactionRepository,
} from '../database/repositories/reportVersion.repository.js';
import { buildReportPreviewSnapshotFixture } from '../test/report-preview.fixture.js';
import { createApiApp } from './api-app.js';
import {
  createPreviewRepositories,
  report,
} from './reports.preview.route.test/support.js';

const config = loadServerConfig({ FRONTEND_ORIGIN: 'http://localhost:5173' });
const versionIdA = 'rvs_00000000-0000-0000-0000-000000000001';
const versionIdB = 'rvs_00000000-0000-0000-0000-000000000002';
const otherReportId = 'rpt_00000000-0000-0000-0000-000000000099';

const buildVersion = (
  id: string,
  version: number,
  status: ReportVersion['status'] = 'draft',
  reportId = report.id,
): ReportVersion => ({
  id,
  reportId,
  version,
  status,
  generatedAt: '2026-06-25',
  filePath: 'C:\\private\\saved-report.json',
  snapshot: buildReportPreviewSnapshotFixture(),
});

const createVersionRepository = (
  options: {
    versions?: ReportVersion[];
    findByIdError?: Error;
    findByReportIdError?: Error;
  } = {},
) => {
  const versions = options.versions ?? [
    buildVersion(versionIdA, 1),
    buildVersion(versionIdB, 10, 'final'),
  ];

  const findById = vi.fn(async (id: string) => {
    if (options.findByIdError) throw options.findByIdError;
    return structuredClone(versions.find(version => version.id === id) ?? null);
  });
  const findByReportId = vi.fn(async (reportId: string) => {
    if (options.findByReportIdError) throw options.findByReportIdError;
    return structuredClone(
      versions.filter(version => version.reportId === reportId),
    );
  });

  const transactionRepository: ReportVersionTransactionRepository = {
    create: vi.fn(async (input: CreateReportVersionInput) => ({
      id: versionIdA,
      ...structuredClone(input),
    })),
    findById,
    findByReportId,
    updateReportLatestVersion: vi.fn(async () => undefined),
    updateReportLatestVersionIfCurrent: vi.fn(async () => undefined),
  };
  const repository: ReportVersionRepository = {
    ...transactionRepository,
    withTransaction: vi.fn(async operation => operation(transactionRepository)),
    withFinalisationTransaction: vi.fn(async () => {
      throw new Error('Finalisation is not used by read routes.');
    }),
  };

  return { repository, findById, findByReportId };
};

const startReadServer = async (
  options: {
    reportMissing?: boolean;
    versions?: ReportVersion[];
    findByIdError?: Error;
    findByReportIdError?: Error;
  } = {},
) => {
  const preview = createPreviewRepositories({
    report: options.reportMissing ? null : report,
  });
  const version = createVersionRepository(options);
  const app = createApiApp(config, {
    ...preview.repositories,
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
    reportFindById: preview.repositories.reportRepository.findById,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

const listResponseSchema = z.object({
  data: z.array(reportVersionResponseSchema),
});
const singleResponseSchema = z.object({ data: reportVersionResponseSchema });

describe('ReportVersion read routes', () => {
  it('lists the parent Report versions in repository order without file paths', async () => {
    const server = await startReadServer();

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${report.id}/versions`,
      );
      expect(response.status).toBe(200);

      const body = listResponseSchema.parse(await response.json());
      expect(body.data.map(version => version.id)).toEqual([
        versionIdA,
        versionIdB,
      ]);
      expect(JSON.stringify(body)).not.toContain('private');
      expect(server.version.findByReportId).toHaveBeenCalledWith(report.id);
    } finally {
      await server.close();
    }
  });

  it('returns one ReportVersion only when it belongs to the parent Report', async () => {
    const server = await startReadServer();

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${report.id}/versions/${versionIdB}`,
      );
      expect(response.status).toBe(200);

      const body = singleResponseSchema.parse(await response.json());
      expect(body.data).toMatchObject({
        id: versionIdB,
        reportId: report.id,
        version: 10,
        status: 'final',
      });
      expect(JSON.stringify(body)).not.toContain('private');
    } finally {
      await server.close();
    }
  });

  it('returns REPORT_NOT_FOUND before reading versions for a missing parent Report', async () => {
    const server = await startReadServer({ reportMissing: true });

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${report.id}/versions`,
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: 'REPORT_NOT_FOUND' },
      });
      expect(server.version.findByReportId).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('uses the same safe not-found response for a missing or cross-report version', async () => {
    const cases: Array<[string, ReportVersion[]]> = [
      ['missing', []],
      ['cross-report', [buildVersion(versionIdA, 1, 'draft', otherReportId)]],
    ];

    for (const [_name, versions] of cases) {
      const server = await startReadServer({ versions });

      try {
        const response = await fetch(
          `${server.baseUrl}/api/reports/${report.id}/versions/${versionIdA}`,
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({
          error: { code: 'REPORT_VERSION_NOT_FOUND' },
        });
      } finally {
        await server.close();
      }
    }
  });

  it.each([
    ['/api/reports/not-a-report/versions', 'invalid report ID'],
    [
      `/api/reports/${report.id}/versions/not-a-version`,
      'invalid ReportVersion ID',
    ],
  ])('rejects %s before repository access (%s)', async (path, _name) => {
    const server = await startReadServer();

    try {
      const response = await fetch(`${server.baseUrl}${path}`);
      expect(response.status).toBe(400);
      expect(server.reportFindById).not.toHaveBeenCalled();
      expect(server.version.findById).not.toHaveBeenCalled();
      expect(server.version.findByReportId).not.toHaveBeenCalled();
    } finally {
      await server.close();
    }
  });

  it('maps repository failures to a safe error without leaking details', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const server = await startReadServer({
      findByReportIdError: new RepositoryError('private database detail'),
    });

    try {
      const response = await fetch(
        `${server.baseUrl}/api/reports/${report.id}/versions`,
      );
      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).toContain('INTERNAL_SERVER_ERROR');
      expect(body).not.toContain('private database detail');
    } finally {
      consoleError.mockRestore();
      await server.close();
    }
  });
});
