import assert from 'node:assert/strict';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  CompanyLogoStorageError,
  CompanyLogoValidationError,
  createCompanyLogoStorage,
} from './companyLogoStorage.js';

const originalCwd = process.cwd();
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'appsec-report-builder-'));

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);
const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]);
const webpBytes = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const validFile = {
  fileName: 'company-logo.png',
  mimeType: 'image/png',
  sizeBytes: pngBytes.length,
  bytes: pngBytes,
};

const createStorage = () =>
  createCompanyLogoStorage({
    randomUUID: () => '00000000-0000-0000-0000-000000000001',
  });

try {
  process.chdir(tempDir);

  const storage = createStorage();

  const validated = storage.validateCompanyLogoFile(validFile);
  assert.deepEqual(validated, {
    fileName: 'company-logo.png',
    mimeType: 'image/png',
    sizeBytes: pngBytes.length,
  });

  assert.throws(
    () =>
      storage.validateCompanyLogoFile({
        ...validFile,
        bytes: jpegBytes,
        sizeBytes: jpegBytes.length,
      }),
    error =>
      error instanceof CompanyLogoValidationError &&
      error.message ===
        'Company logo file content does not match the supplied mime type',
  );

  assert.throws(
    () =>
      storage.validateCompanyLogoFile({
        ...validFile,
        fileName: 'company-logo.svg',
      }),
    error =>
      error instanceof CompanyLogoValidationError &&
      error.message ===
        'Company logo file extension must match the supplied mime type',
  );

  assert.throws(
    () =>
      storage.validateCompanyLogoFile({
        ...validFile,
        sizeBytes: 5 * 1024 * 1024 + 1,
      }),
    error =>
      error instanceof CompanyLogoValidationError &&
      error.message === 'Company logo file must be 5 MB or smaller',
  );

  assert.throws(
    () =>
      storage.validateCompanyLogoFile({
        ...validFile,
        fileName: '../company-logo.png',
      }),
    error =>
      error instanceof CompanyLogoValidationError &&
      error.message === 'Company logo file name is not allowed',
  );

  const jpegValidation = storage.validateCompanyLogoFile({
    fileName: 'branding.JPG',
    mimeType: 'image/jpeg',
    sizeBytes: jpegBytes.length,
    bytes: jpegBytes,
  });
  assert.equal(jpegValidation.fileName, 'branding.JPG');
  assert.equal(jpegValidation.mimeType, 'image/jpeg');

  const webpValidation = storage.validateCompanyLogoFile({
    fileName: 'branding.webp',
    mimeType: 'image/webp',
    sizeBytes: webpBytes.length,
    bytes: webpBytes,
  });
  assert.equal(webpValidation.fileName, 'branding.webp');
  assert.equal(webpValidation.mimeType, 'image/webp');

  const companyLogoKey = storage.buildCompanyLogoStorageKey(
    'cmp_00000000-0000-0000-0000-000000000001',
    'company-logo.png',
  );
  assert.equal(
    companyLogoKey,
    'uploads/company-logos/cmp_00000000-0000-0000-0000-000000000001/logo_00000000-0000-0000-0000-000000000001.png',
  );
  assert.equal(path.isAbsolute(companyLogoKey), false);
  assert.equal(companyLogoKey.includes('\\'), false);

  await writeFile(path.join(tempDir, 'company-logo.png'), pngBytes);

  await storage.stageCompanyLogoReplacement({
    sourcePath: path.join(tempDir, 'company-logo.png'),
    targetStorageKey: companyLogoKey,
  });
  assert.deepEqual(await storage.readCompanyLogoFile(companyLogoKey), pngBytes);
  await access(path.join(tempDir, companyLogoKey));

  const cleanupFailureStorage = createCompanyLogoStorage({
    fs: {
      copyFile,
      mkdir,
      readFile,
      rename,
      rm: async (filePath, options) => {
        if (filePath.endsWith('cleanup-previous.png')) {
          throw new Error('cleanup failed');
        }

        return rm(filePath, options);
      },
    },
    randomUUID: () => '00000000-0000-0000-0000-000000000002',
  });

  const cleanupFailureTargetKey =
    cleanupFailureStorage.buildCompanyLogoStorageKey(
      'cmp_00000000-0000-0000-0000-000000000001',
      'cleanup.png',
    );
  const cleanupFailureTargetPath = path.join(tempDir, cleanupFailureTargetKey);
  const cleanupFailurePreviousKey =
    'uploads/company-logos/cmp_00000000-0000-0000-0000-000000000001/cleanup-previous.png';
  const cleanupFailurePreviousPath = path.join(
    tempDir,
    cleanupFailurePreviousKey,
  );
  await writeFile(path.join(tempDir, 'cleanup.png'), pngBytes);
  await mkdir(path.dirname(cleanupFailurePreviousPath), { recursive: true });
  await writeFile(cleanupFailurePreviousPath, pngBytes);

  await assert.rejects(
    cleanupFailureStorage.stageCompanyLogoReplacement({
      sourcePath: path.join(tempDir, 'cleanup.png'),
      targetStorageKey: cleanupFailureTargetKey,
      previousStorageKey: cleanupFailurePreviousKey,
    }),
    error =>
      error instanceof CompanyLogoStorageError &&
      error.message === 'Failed to clean up the replaced company logo file',
  );
  await assert.rejects(
    access(cleanupFailureTargetPath),
    error => error instanceof Error,
  );
  await access(cleanupFailurePreviousPath);

  const stageFailureStorage = createCompanyLogoStorage({
    fs: {
      copyFile,
      mkdir,
      readFile,
      rename: async () => {
        throw new Error('stage failed');
      },
      rm,
    },
    randomUUID: () => '00000000-0000-0000-0000-000000000003',
  });

  const stageFailureTargetKey = stageFailureStorage.buildCompanyLogoStorageKey(
    'cmp_00000000-0000-0000-0000-000000000001',
    'stage.png',
  );
  const stageFailureTargetPath = path.join(tempDir, stageFailureTargetKey);
  const stageFailurePath = `${stageFailureTargetPath}.staged-00000000-0000-0000-0000-000000000003`;
  await writeFile(path.join(tempDir, 'stage.png'), pngBytes);

  await assert.rejects(
    stageFailureStorage.stageCompanyLogoReplacement({
      sourcePath: path.join(tempDir, 'stage.png'),
      targetStorageKey: stageFailureTargetKey,
    }),
    error =>
      error instanceof CompanyLogoStorageError &&
      error.message === 'Failed to stage company logo file',
  );
  await assert.rejects(
    access(stageFailureTargetPath),
    error => error instanceof Error,
  );
  await assert.rejects(
    access(stageFailurePath),
    error => error instanceof Error,
  );

  await assert.rejects(
    storage.readCompanyLogoFile('../company-logo.png'),
    error =>
      error instanceof CompanyLogoStorageError &&
      error.message === 'Company logo storage key is invalid',
  );

  await storage.deleteCompanyLogoFile(companyLogoKey);
  await assert.rejects(
    access(path.join(tempDir, companyLogoKey)),
    error => error instanceof Error,
  );

  const outsideFile = path.join(tempDir, 'outside.txt');
  await writeFile(outsideFile, 'keep me', 'utf8');

  await assert.rejects(
    storage.deleteCompanyLogoFile('../outside.txt'),
    error =>
      error instanceof CompanyLogoStorageError &&
      error.message === 'Company logo storage key is invalid',
  );
  await access(outsideFile);
} finally {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
}

console.log('company logo storage checks passed');
