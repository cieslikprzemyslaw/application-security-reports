import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { resolvePathWithinRoot } from '../../src/validation/index.js';

const companyLogoRoot = 'uploads/company-logos';
const companyLogoMaxSizeBytes = 5 * 1024 * 1024;

const supportedCompanyLogoMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const supportedCompanyLogoExtensionsByMimeType: Record<
  (typeof supportedCompanyLogoMimeTypes)[number],
  readonly string[]
> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const jpegMagicBytes = [0xff, 0xd8, 0xff] as const;
const pngMagicBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export type CompanyLogoMimeType =
  (typeof supportedCompanyLogoMimeTypes)[number];

export type CompanyLogoValidatedFile = {
  fileName: string;
  mimeType: CompanyLogoMimeType;
  sizeBytes: number;
};

export type CompanyLogoFileInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type CompanyLogoStorageDependencies = {
  fs?: Pick<typeof fs, 'copyFile' | 'mkdir' | 'readFile' | 'rename' | 'rm'>;
  randomUUID?: () => string;
};

export class CompanyLogoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyLogoStorageError';
  }
}

export class CompanyLogoValidationError extends CompanyLogoStorageError {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyLogoValidationError';
  }
}

const isSafeCompanyLogoFileName = (value: string): boolean => {
  const normalized = value.trim();

  if (normalized.length === 0 || normalized === '.' || normalized === '..') {
    return false;
  }

  if (/[\\/:<>"|?*\0]/.test(normalized)) {
    return false;
  }

  return !normalized.split(/[\\/]/).some(segment => segment === '..');
};

const detectMimeTypeFromBytes = (
  bytes: Uint8Array,
): CompanyLogoMimeType | null => {
  const hasPrefix = (prefix: readonly number[]) =>
    prefix.every((value, index) => bytes[index] === value);

  if (hasPrefix(jpegMagicBytes)) {
    return 'image/jpeg';
  }

  if (hasPrefix(pngMagicBytes)) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

const getStoragePath = (storageKey: string): string => {
  const resolvedPath = resolvePathWithinRoot(companyLogoRoot, storageKey);

  if (!resolvedPath) {
    throw new CompanyLogoStorageError('Company logo storage key is invalid');
  }

  return resolvedPath;
};

const createStagedStorageKey = (
  storageKey: string,
  randomSuffix: string,
): string => `${storageKey}.staged-${randomSuffix}`;

export type CompanyLogoStorage = ReturnType<typeof createCompanyLogoStorage>;

export const createCompanyLogoStorage = (
  dependencies: CompanyLogoStorageDependencies = {},
) => {
  const fileSystem = dependencies.fs ?? fs;
  const generateRandomUUID = dependencies.randomUUID ?? randomUUID;

  const validateCompanyLogoFile = (
    input: CompanyLogoFileInput,
  ): CompanyLogoValidatedFile => {
    const fileName = input.fileName.trim();
    const actualSizeBytes = input.bytes.byteLength;

    if (!isSafeCompanyLogoFileName(fileName)) {
      throw new CompanyLogoValidationError(
        'Company logo file name is not allowed',
      );
    }

    if (
      input.sizeBytes > companyLogoMaxSizeBytes ||
      actualSizeBytes > companyLogoMaxSizeBytes
    ) {
      throw new CompanyLogoValidationError(
        'Company logo file must be 5 MB or smaller',
      );
    }

    if (input.sizeBytes !== actualSizeBytes) {
      throw new CompanyLogoValidationError(
        'Company logo file size does not match the supplied metadata',
      );
    }

    const mimeType = input.mimeType.trim() as CompanyLogoMimeType;

    if (!supportedCompanyLogoMimeTypes.includes(mimeType)) {
      throw new CompanyLogoValidationError(
        'Company logo file type is not supported',
      );
    }

    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions =
      supportedCompanyLogoExtensionsByMimeType[mimeType];

    if (!allowedExtensions.includes(extension)) {
      throw new CompanyLogoValidationError(
        'Company logo file extension must match the supplied mime type',
      );
    }

    const detectedMimeType = detectMimeTypeFromBytes(input.bytes);

    if (detectedMimeType !== mimeType) {
      throw new CompanyLogoValidationError(
        'Company logo file content does not match the supplied mime type',
      );
    }

    return {
      fileName,
      mimeType,
      sizeBytes: input.sizeBytes,
    };
  };

  const buildCompanyLogoStorageKey = (
    companyId: string,
    fileName: string,
    logoId = `logo_${generateRandomUUID()}`,
  ): string => {
    if (companyId.trim().length === 0) {
      throw new CompanyLogoStorageError('Company ID is required');
    }

    const extension = path.extname(fileName.trim()).toLowerCase();

    if (extension.length === 0) {
      throw new CompanyLogoStorageError(
        'Company logo file extension is required',
      );
    }

    const storageKey = path.posix.join(
      companyLogoRoot,
      companyId.trim(),
      `${logoId}${extension}`,
    );

    getStoragePath(storageKey);

    return storageKey;
  };

  const readCompanyLogoFile = async (storageKey: string): Promise<Buffer> => {
    const filePath = getStoragePath(storageKey);

    return fileSystem.readFile(filePath);
  };

  const deleteCompanyLogoFile = async (storageKey: string): Promise<void> => {
    const filePath = getStoragePath(storageKey);

    await fileSystem.rm(filePath, { force: true, recursive: false });
  };

  const stageCompanyLogoReplacement = async (input: {
    sourcePath: string;
    targetStorageKey: string;
    previousStorageKey?: string;
  }): Promise<void> => {
    const targetFilePath = getStoragePath(input.targetStorageKey);
    const stagedFilePath = createStagedStorageKey(
      targetFilePath,
      generateRandomUUID(),
    );

    await fileSystem.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fileSystem.copyFile(input.sourcePath, stagedFilePath);

    try {
      await fileSystem.rename(stagedFilePath, targetFilePath);
    } catch {
      await fileSystem
        .rm(stagedFilePath, { force: true })
        .catch(() => undefined);
      throw new CompanyLogoStorageError('Failed to stage company logo file');
    }

    if (
      input.previousStorageKey &&
      input.previousStorageKey !== input.targetStorageKey
    ) {
      try {
        await deleteCompanyLogoFile(input.previousStorageKey);
      } catch {
        await fileSystem
          .rm(targetFilePath, { force: true })
          .catch(() => undefined);
        throw new CompanyLogoStorageError(
          'Failed to clean up the replaced company logo file',
        );
      }
    }
  };

  return {
    validateCompanyLogoFile,
    buildCompanyLogoStorageKey,
    readCompanyLogoFile,
    deleteCompanyLogoFile,
    stageCompanyLogoReplacement,
  };
};
