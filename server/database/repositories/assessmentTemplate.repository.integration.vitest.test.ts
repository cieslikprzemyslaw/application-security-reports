import { afterEach, describe, expect, it } from 'vitest';

import { RepositoryStateError } from '../errors.js';
import { createTemporaryDatabase } from '../../test/temporaryDatabase.js';
import { createAssessmentTemplateRepository } from './assessmentTemplate.repository.js';

const databases: Array<
  Awaited<ReturnType<typeof createTemporaryDatabase>>
> = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map(database => database.cleanup()));
});

const createHarness = async () => {
  const database = await createTemporaryDatabase();
  databases.push(database);

  return {
    database,
    repository: createAssessmentTemplateRepository(database.prisma),
  };
};

const createInput = (name: string) => ({
  name,
  assessmentType: 'Web App',
  environment: 'Production',
  description: 'Reusable defaults',
  scope: 'Public routes',
});

describe('Assessment Template repository', () => {
  it('creates prefixed records and lists active templates newest-updated first', async () => {
    const { database, repository } = await createHarness();
    const first = await repository.create(createInput('First'));
    const second = await repository.create(createInput('Second'));

    expect(first.id).toMatch(/^tpl_[0-9a-f-]{36}$/i);

    await database.prisma.assessmentTemplate.update({
      where: { id: first.id },
      data: { updatedAt: new Date('2030-01-01T00:00:00.000Z') },
    });

    const active = await repository.findAll();
    expect(active.map(template => template.id)).toEqual([first.id, second.id]);
  });

  it('archives and restores idempotently without changing reusable values', async () => {
    const { repository } = await createHarness();
    const created = await repository.create(createInput('Reusable API review'));

    const archived = await repository.archive(created.id);
    const archivedAgain = await repository.archive(created.id);

    expect(archived.archivedAt).toBeTruthy();
    expect(archivedAgain.archivedAt).toBe(archived.archivedAt);
    expect(await repository.findAll()).toEqual([]);

    const allTemplates = await repository.findAll({ includeArchived: true });
    expect(allTemplates).toHaveLength(1);

    await expect(
      repository.update(created.id, { name: 'Blocked edit' }),
    ).rejects.toBeInstanceOf(RepositoryStateError);

    const restored = await repository.restore(created.id);
    const restoredAgain = await repository.restore(created.id);

    expect(restored.archivedAt).toBeNull();
    expect(restoredAgain.archivedAt).toBeNull();
    expect(restored.name).toBe(created.name);
    expect(restored.description).toBe(created.description);
    expect(await repository.findAll()).toHaveLength(1);
  });
});
