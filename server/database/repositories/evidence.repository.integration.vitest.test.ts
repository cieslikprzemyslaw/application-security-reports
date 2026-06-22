import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RepositoryConstraintError } from '../errors.js';
import {
  createTemporaryDatabase,
  type TemporaryDatabase,
} from '../../test/temporaryDatabase.js';
import { createEvidenceRepository } from './evidence.repository.js';

const companyId = 'cmp_00000000-0000-0000-0000-000000000001';
const assessmentId = 'asm_00000000-0000-0000-0000-000000000001';
const threatId = 'thr_00000000-0000-0000-0000-000000000001';

describe('Evidence repository with temporary SQLite', () => {
  let database: TemporaryDatabase | undefined;

  beforeEach(async () => {
    database = await createTemporaryDatabase();

    await database.prisma.company.create({
      data: { id: companyId, name: 'Northstar Digital' },
    });
    await database.prisma.assessment.create({
      data: {
        id: assessmentId,
        companyId,
        title: 'Customer Services Portal',
        status: 'draft',
        owaspTaxonomyVersion: '2025',
      },
    });
    await database.prisma.threat.create({
      data: {
        id: threatId,
        assessmentId,
        title: 'Missing authorization',
        description: 'Another customer record can be loaded.',
        severity: 'high',
        strideCategories: ['spoofing'],
        status: 'open',
        owaspCategoryCode: 'A01:2025',
      },
    });
  });

  afterEach(async () => {
    await database?.cleanup();
    database = undefined;
  });

  const getDatabase = () => {
    if (!database) {
      throw new Error('Temporary database has not been created.');
    }

    return database;
  };

  it('creates, reads, filters, and patches Evidence with relationships', async () => {
    const { prisma } = getDatabase();
    const repository = createEvidenceRepository(prisma);

    const created = await repository.create({
      assessmentId,
      threatIds: [threatId, threatId],
      type: 'note',
      title: 'Authorization reproduction',
      content: 'GET /api/orders/2',
    });

    expect(created.id).toMatch(/^evd_/);
    expect(created.threatIds).toEqual([threatId]);
    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findByAssessmentId(assessmentId)).resolves.toEqual([
      created,
    ]);

    const updated = await repository.update(created.id, {
      title: 'Updated reproduction',
      threatIds: [],
    });

    expect(updated.title).toBe('Updated reproduction');
    expect(updated.threatIds).toEqual([]);
    await expect(prisma.evidenceThreat.count()).resolves.toBe(0);
  });

  it('rejects a missing Assessment without inserting Evidence', async () => {
    const { prisma } = getDatabase();
    const repository = createEvidenceRepository(prisma);
    const before = await prisma.evidence.count();

    await expect(
      repository.create({
        assessmentId: 'asm_00000000-0000-0000-0000-000000000099',
        threatIds: [],
        type: 'note',
        title: 'Invalid relationship',
      }),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);

    await expect(prisma.evidence.count()).resolves.toBe(before);
  });

  it('rolls back field and relationship changes when a PATCH link fails', async () => {
    const { prisma } = getDatabase();
    const repository = createEvidenceRepository(prisma);
    const created = await repository.create({
      assessmentId,
      threatIds: [threatId],
      type: 'note',
      title: 'Original title',
    });
    const before = await prisma.evidence.findUnique({
      where: { id: created.id },
      include: { threatLinks: true },
    });

    await expect(
      repository.update(created.id, {
        title: 'Must not persist',
        threatIds: ['thr_00000000-0000-0000-0000-000000000099'],
      }),
    ).rejects.toBeInstanceOf(RepositoryConstraintError);

    await expect(
      prisma.evidence.findUnique({
        where: { id: created.id },
        include: { threatLinks: true },
      }),
    ).resolves.toEqual(before);
  });

  it('persists and replaces ordered HTTP exchanges atomically', async () => {
    const { prisma } = getDatabase();
    const repository = createEvidenceRepository(prisma);
    const created = await repository.create({
      assessmentId,
      threatIds: [],
      type: 'http',
      title: 'HTTP exchange',
      httpExchanges: [
        {
          request: { method: 'GET', url: '/api/orders/2' },
          response: { statusCode: 200 },
        },
        {
          request: { method: 'POST', url: '/api/orders/2' },
          response: { statusCode: 201 },
        },
      ],
    });

    expect(created.httpExchanges?.map(item => item.request.method)).toEqual([
      'GET',
      'POST',
    ]);

    const updated = await repository.update(created.id, {
      httpExchanges: [
        {
          request: { method: 'DELETE', url: '/api/orders/2' },
          response: { statusCode: 204 },
        },
      ],
    });

    expect(updated.httpExchanges?.map(item => item.request.method)).toEqual([
      'DELETE',
    ]);
    await expect(
      prisma.evidenceExchange.count({
        where: { evidenceId: created.id },
      }),
    ).resolves.toBe(1);
  });
});
