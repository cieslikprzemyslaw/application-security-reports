import { randomUUID } from 'node:crypto';
import { access, rm } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  IssuerLogoStorageError,
  IssuerLogoValidationError,
  createIssuerLogoStorage,
  issuerLogoMaxSizeBytes,
} from './issuerLogoStorage.js';

const pngBytes = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
const webpBytes = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const roots: string[] = [];

const createStorage = () => {
  const rootDirectory = path.posix.join(
    'uploads',
    `issuer-logo-storage-test-${randomUUID()}`,
  );
  roots.push(rootDirectory);

  return createIssuerLogoStorage({
    rootDirectory,
    randomUUID: () => '00000000-0000-0000-0000-000000000001',
  });
};

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(rootDirectory =>
      rm(path.resolve(process.cwd(), rootDirectory), {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('issuer logo storage', () => {
  it('validates supported image types and creates managed IDs', () => {
    const storage = createStorage();

    expect(
      storage.validateIssuerLogoFile({
        fileName: 'issuer-logo.png',
        mimeType: 'image/png',
        sizeBytes: pngBytes.length,
        bytes: pngBytes,
      }),
    ).toEqual({
      fileName: 'issuer-logo.png',
      mimeType: 'image/png',
      sizeBytes: pngBytes.length,
    });

    expect(
      storage.validateIssuerLogoFile({
        fileName: 'issuer-logo.JPEG',
        mimeType: 'image/jpeg',
        sizeBytes: jpegBytes.length,
        bytes: jpegBytes,
      }).mimeType,
    ).toBe('image/jpeg');

    expect(
      storage.validateIssuerLogoFile({
        fileName: 'issuer-logo.webp',
        mimeType: 'image/webp',
        sizeBytes: webpBytes.length,
        bytes: webpBytes,
      }).mimeType,
    ).toBe('image/webp');

    expect(storage.createIssuerLogoId()).toBe(
      'logo_00000000-0000-0000-0000-000000000001',
    );
  });

  it.each([
    {
      name: 'unsafe file name',
      input: {
        fileName: '../issuer-logo.png',
        mimeType: 'image/png',
        sizeBytes: pngBytes.length,
        bytes: pngBytes,
      },
      message: 'Issuer logo file name is not allowed',
    },
    {
      name: 'unsupported type',
      input: {
        fileName: 'issuer-logo.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: pngBytes.length,
        bytes: pngBytes,
      },
      message: 'Issuer logo file type is not supported',
    },
    {
      name: 'extension mismatch',
      input: {
        fileName: 'issuer-logo.jpg',
        mimeType: 'image/png',
        sizeBytes: pngBytes.length,
        bytes: pngBytes,
      },
      message: 'Issuer logo file extension must match the supplied mime type',
    },
    {
      name: 'magic-byte mismatch',
      input: {
        fileName: 'issuer-logo.png',
        mimeType: 'image/png',
        sizeBytes: jpegBytes.length,
        bytes: jpegBytes,
      },
      message: 'Issuer logo file content does not match the supplied mime type',
    },
    {
      name: 'declared-size mismatch',
      input: {
        fileName: 'issuer-logo.png',
        mimeType: 'image/png',
        sizeBytes: pngBytes.length + 1,
        bytes: pngBytes,
      },
      message: 'Issuer logo file size does not match the supplied metadata',
    },
  ])('rejects $name', ({ input, message }) => {
    const storage = createStorage();

    expect(() => storage.validateIssuerLogoFile(input)).toThrowError(
      new IssuerLogoValidationError(message),
    );
  });

  it('rejects files larger than 5 MB', () => {
    const storage = createStorage();

    expect(() =>
      storage.validateIssuerLogoFile({
        fileName: 'issuer-logo.png',
        mimeType: 'image/png',
        sizeBytes: issuerLogoMaxSizeBytes + 1,
        bytes: pngBytes,
      }),
    ).toThrow('Issuer logo file must be 5 MB or smaller');
  });

  it('stages, reads, and deletes a managed logo without exposing a path', async () => {
    const storage = createStorage();
    const logoId = storage.createIssuerLogoId();

    await storage.stageIssuerLogoFile({
      logoId,
      fileName: 'issuer-logo.png',
      bytes: pngBytes,
    });

    await expect(storage.readIssuerLogoFile(logoId)).resolves.toEqual({
      bytes: pngBytes,
      mimeType: 'image/png',
    });

    await storage.deleteIssuerLogoFile(logoId);
    await expect(storage.readIssuerLogoFile(logoId)).rejects.toThrow(
      IssuerLogoStorageError,
    );
  });

  it('rejects a traversal-style managed logo reference', async () => {
    const storage = createStorage();

    await expect(
      storage.stageIssuerLogoFile({
        logoId: '../outside',
        fileName: 'issuer-logo.png',
        bytes: pngBytes,
      }),
    ).rejects.toThrow('Issuer logo reference is invalid');

    await expect(
      access(path.resolve(process.cwd(), 'uploads', 'outside.png')),
    ).rejects.toBeDefined();
  });
});
