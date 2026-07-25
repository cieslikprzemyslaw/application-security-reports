import { createServer } from 'node:http';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadServerConfig } from '../config.js';
import { createActivityRepository } from '../database/repositories/activity.repository.js';
import { createAssessmentRepository } from '../database/repositories/assessment.repository.js';
import { createCompanyRepository } from '../database/repositories/company.repository.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../test/temporaryDatabase.js';
import { createApiApp } from './api-app.js';

const config = loadServerConfig({
  FRONTEND_ORIGIN: 'http://localhost:5173',
});

const companyOneId = 'cmp_00000000-0000-0000-0000-000000000001';
const companyTwoId = 'cmp_00000000-0000-0000-0000-000000000002';
const assessmentOneId = 'asm_00000000-0000-0000-0000-000000000001';
const assessmentTwoId = 'asm_00000000-0000-0000-0000-000000000002';

const startServer = async (database: TemporaryDatabase) => {
  const activityRepository = createActivityRepository(database.prisma);
  const assessmentRepository = createAssessmentRepository(database.prisma);
  const companyRepository = createCompanyRepository(database.prisma);
  const server = createServer(
    createApiApp(config, {
      activityRepository,
      assessmentRepository,
      companyRepository,
    }),
  );

  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Expected an ephemeral test port.');
  }

  return {
    activityRepository,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      }),
  };
};

const appendAssessmentActivity = async (
  repository: ReturnType<typeof createActivityRepository>,
  input: {
    companyId: string;
    assessmentId: string;
    eventType: 'assessment.completed' | 'assessment.reopened';
    createdAt: string;
  },
) =>
  repository.append({
    eventType: input.eventType,
    result: 'success',
    severity: 'informational',
    actor: { type: 'local-user' },
    resource: {
      type: 'assessment',
      id: input.assessmentId,
      companyId: input.companyId,
      assessmentId: input.assessmentId,
    },
    message:
      input.eventType === 'assessment.completed'
        ? 'Assessment completed.'
        : 'Assessment reopened.',
    createdAt: input.createdAt,
  });

describe.sequential('Scoped Activity API integration', () => {
  let database: TemporaryDatabase;
  let server: Awaited<ReturnType<typeof startServer>>;

  beforeEach(async () => {
    database = await createTemporaryDatabase();
    await database.prisma.company.createMany({
      data: [
        { id: companyOneId, name: 'Northstar Digital' },
        { id: companyTwoId, name: 'Contoso Security' },
      ],
    });
    await database.prisma.assessment.createMany({
      data: [
        {
          id: assessmentOneId,
          companyId: companyOneId,
          title: 'Portal assessment',
          applicationName: 'Portal',
          status: 'draft',
        },
        {
          id: assessmentTwoId,
          companyId: companyTwoId,
          title: 'API assessment',
          applicationName: 'API',
          status: 'draft',
        },
      ],
    });
    server = await startServer(database);
    await appendAssessmentActivity(server.activityRepository, {
      companyId: companyOneId,
      assessmentId: assessmentOneId,
      eventType: 'assessment.completed',
      createdAt: '2026-07-25T08:00:00.000Z',
    });
    await appendAssessmentActivity(server.activityRepository, {
      companyId: companyOneId,
      assessmentId: assessmentOneId,
      eventType: 'assessment.reopened',
      createdAt: '2026-07-25T09:00:00.000Z',
    });
    await appendAssessmentActivity(server.activityRepository, {
      companyId: companyTwoId,
      assessmentId: assessmentTwoId,
      eventType: 'assessment.completed',
      createdAt: '2026-07-25T10:00:00.000Z',
    });
  });

  afterEach(async () => {
    await server.close();
    await database.cleanup();
  });

  it('returns only Company-scoped events in stable order', async () => {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${companyOneId}/activity?limit=1`,
    );
    const body = (await response.json()) as {
      data: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      eventType: 'assessment.reopened',
      message: 'Assessment reopened.',
    });
    expect(JSON.stringify(body)).not.toContain('entityType');
    expect(JSON.stringify(body)).not.toContain('filePath');
  });

  it('returns only Assessment-scoped events in stable order', async () => {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${companyOneId}/assessments/${assessmentOneId}/activity`,
    );
    const body = (await response.json()) as {
      data: Array<{ eventType: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.data.map(item => item.eventType)).toEqual([
      'assessment.reopened',
      'assessment.completed',
    ]);
  });

  it('uses safe not-found responses for missing and cross-scope resources', async () => {
    const missingCompany = await fetch(
      `${server.baseUrl}/api/companies/cmp_00000000-0000-0000-0000-000000000099/activity`,
    );
    const crossScope = await fetch(
      `${server.baseUrl}/api/companies/${companyOneId}/assessments/${assessmentTwoId}/activity`,
    );

    expect(missingCompany.status).toBe(404);
    expect(crossScope.status).toBe(404);
    expect(await crossScope.json()).toEqual({
      error: {
        code: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
        details: [],
      },
    });
  });

  it('rejects invalid list limits before querying activity', async () => {
    const response = await fetch(
      `${server.baseUrl}/api/companies/${companyOneId}/activity?limit=0`,
    );

    expect(response.status).toBe(400);
  });
});
