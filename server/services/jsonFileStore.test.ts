import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { companiesFileSchema } from '../../src/domain/schemas/index.js';
import { JsonParseError, ValidationError } from '../../src/validation/index.js';

import { readJsonFile, writeJsonFile } from './jsonFileStore.js';

const originalCwd = process.cwd();
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-report-builder-'));

const validCompanyData = [
  {
    id: 'cmp_1',
    name: 'Northstar Digital',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
];

try {
  process.chdir(tempDir);

  await writeJsonFile('companies.json', validCompanyData);

  const roundTripped = await readJsonFile(
    'companies.json',
    companiesFileSchema,
  );
  assert.deepEqual(roundTripped, validCompanyData);

  await mkdir(path.join(tempDir, 'data'), { recursive: true });
  await writeFile(
    path.join(tempDir, 'data', 'invalid-json.json'),
    '{not json',
    'utf8',
  );

  try {
    await readJsonFile('invalid-json.json', companiesFileSchema);
    assert.fail('Expected invalid JSON to fail');
  } catch (error) {
    assert.ok(error instanceof JsonParseError);
    assert.equal(error.response.error, 'INVALID_JSON');
  }

  await writeFile(
    path.join(tempDir, 'data', 'invalid-data.json'),
    JSON.stringify([
      {
        id: 'cmp_1',
        name: '',
        createdAt: 'bad-date',
        updatedAt: '2026-06-10T00:00:00.000Z',
        isAdmin: true,
      },
    ]),
    'utf8',
  );

  try {
    await readJsonFile('invalid-data.json', companiesFileSchema);
    assert.fail('Expected invalid data to fail');
  } catch (error) {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.response.error, 'VALIDATION_ERROR');
    assert.ok(
      error.response.fields.some(field => field.path === '0.name'),
      'Expected the array index to appear in the error path',
    );
    assert.ok(
      error.response.fields.some(field => field.path === '0.createdAt'),
      'Expected the nested timestamp path to appear in the error path',
    );
    assert.ok(
      error.response.fields.some(field => field.path === '0.isAdmin'),
      'Expected unknown properties to surface their field path',
    );
  }
} finally {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
}

console.log('json file store validation checks passed');
