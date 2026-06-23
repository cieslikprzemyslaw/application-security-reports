import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { resolvePathWithinRoot } from '../../src/validation/index.js';

const defaultIssuerLogoRoot = 'uploads/issuer-logos';
export const issuerLogoMaxSizeBytes = 5 * 1024 * 1024;

const supportedIssuerLogoMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const supportedIssuerLogoExtensionsByMimeType: Record<
  (typeof supportedIssuerLogoMimeTypes)[number],
  readonly string[]
> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const issuerLogoMimeTypeByExtension: Record<string, IssuerLogoMimeType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const supportedIssuerLogoExtensions = Object.keys(
  issuerLogoMimeTypeByExtension,
);

const jpegMagicBytes = [0xff, 0xd8, 0xff] as const;
const pngMagicBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export type IssuerLogoMimeType = (typeof supportedIssuerLogoMimeTypes)[number];

export type IssuerLogoValidatedFile = {
  fileName: string;
  mimeType: IssuerLogoMimeType;
  sizeBytes: number;
};

export type IssuerLogoFileInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type IssuerLogoReadResult = {
  bytes: Buffer;
  mimeType: IssuerLogoMimeType;
};

export type IssuerLogoStorageDependencies = {
  fs?: Pick<typeof fs, 'mkdir' | 'readFile' | 'rename' | 'rm' | 'writeFile'>;
  randomUUID?: () => string;
  rootDirectory?: string;
};

export class IssuerLogoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IssuerLogoStorageError';
  }
}

export class IssuerLogoValidationError extends IssuerLogoStorageError {
  constructor(message: string) {
    super(message);
    this.name = 'IssuerLogoValidationError';
  }
}

const isSafeIssuerLogoFileName = (value: string): boolean => {
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
): IssuerLogoMimeType | null => {
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

const isFileNotFoundError = (error: unknown): boolean =>
  error instanceof Error &&
  'code' in error &&
  (error as NodeJS.ErrnoException).code === 'ENOENT';

export type IssuerLogoStorage = ReturnType<typeof createIssuerLogoStorage>;

export const createIssuerLogoStorage = (
  dependencies: IssuerLogoStorageDependencies = {},
) => {
  const fileSystem = dependencies.fs ?? fs;
  const generateRandomUUID = dependencies.randomUUID ?? randomUUID;
  const issuerLogoRoot =
    dependencies.rootDirectory?.trim() || defaultIssuerLogoRoot;

  const getStoragePath = (logoId: string, extension: string): string => {
    const storageKey = path.posix.join(
      issuerLogoRoot,
      `${logoId.trim()}${extension}`,
    );
    const resolvedPath = resolvePathWithinRoot(issuerLogoRoot, storageKey);

    if (!resolvedPath) {
      throw new IssuerLogoStorageError('Issuer logo reference is invalid');
    }

    return resolvedPath;
  };

  const validateIssuerLogoFile = (
    input: IssuerLogoFileInput,
  ): IssuerLogoValidatedFile => {
    const fileName = input.fileName.trim();
    const actualSizeBytes = input.bytes.byteLength;

    if (!isSafeIssuerLogoFileName(fileName)) {
      throw new IssuerLogoValidationError(
        'Issuer logo file name is not allowed',
      );
    }

    if (
      input.sizeBytes > issuerLogoMaxSizeBytes ||
      actualSizeBytes > issuerLogoMaxSizeBytes
    ) {
      throw new IssuerLogoValidationError(
        'Issuer logo file must be 5 MB or smaller',
      );
    }

    if (input.sizeBytes !== actualSizeBytes) {
      throw new IssuerLogoValidationError(
        'Issuer logo file size does not match the supplied metadata',
      );
    }

    const mimeType = input.mimeType.trim() as IssuerLogoMimeType;

    if (!supportedIssuerLogoMimeTypes.includes(mimeType)) {
      throw new IssuerLogoValidationError(
        'Issuer logo file type is not supported',
      );
    }

    const extension = path.extname(fileName).toLowerCase();
    const allowedExtensions = supportedIssuerLogoExtensionsByMimeType[mimeType];

    if (!allowedExtensions.includes(extension)) {
      throw new IssuerLogoValidationError(
        'Issuer logo file extension must match the supplied mime type',
      );
    }

    const detectedMimeType = detectMimeTypeFromBytes(input.bytes);

    if (detectedMimeType !== mimeType) {
      throw new IssuerLogoValidationError(
        'Issuer logo file content does not match the supplied mime type',
      );
    }

    return {
      fileName,
      mimeType,
      sizeBytes: input.sizeBytes,
    };
  };

  const createIssuerLogoId = (): string => `logo_${generateRandomUUID()}`;

  const stageIssuerLogoFile = async (input: {
    logoId: string;
    fileName: string;
    bytes: Uint8Array;
  }): Promise<void> => {
    const extension = path.extname(input.fileName.trim()).toLowerCase();
    const targetFilePath = getStoragePath(input.logoId, extension);
    const stagedFilePath = `${targetFilePath}.staged-${generateRandomUUID()}`;

    try {
      await fileSystem.mkdir(path.dirname(targetFilePath), { recursive: true });
      await fileSystem.writeFile(stagedFilePath, input.bytes, { flag: 'wx' });
      await fileSystem.rename(stagedFilePath, targetFilePath);
    } catch (_error) {
      await fileSystem
        .rm(stagedFilePath, { force: true, recursive: false })
        .catch(() => undefined);
      throw new IssuerLogoStorageError('Failed to stage issuer logo file');
    }
  };

  const readIssuerLogoFile = async (
    logoId: string,
  ): Promise<IssuerLogoReadResult> => {
    for (const extension of supportedIssuerLogoExtensions) {
      const filePath = getStoragePath(logoId, extension);

      try {
        return {
          bytes: await fileSystem.readFile(filePath),
          mimeType: issuerLogoMimeTypeByExtension[extension],
        };
      } catch (error) {
        if (isFileNotFoundError(error)) {
          continue;
        }

        throw new IssuerLogoStorageError('Failed to read issuer logo file');
      }
    }

    throw new IssuerLogoStorageError(
      'Issuer logo reference does not resolve to a stored file',
    );
  };

  const deleteIssuerLogoFile = async (logoId: string): Promise<void> => {
    try {
      await Promise.all(
        supportedIssuerLogoExtensions.map(extension =>
          fileSystem.rm(getStoragePath(logoId, extension), {
            force: true,
            recursive: false,
          }),
        ),
      );
    } catch (_error) {
      throw new IssuerLogoStorageError('Failed to delete issuer logo file');
    }
  };

  return {
    validateIssuerLogoFile,
    createIssuerLogoId,
    stageIssuerLogoFile,
    readIssuerLogoFile,
    deleteIssuerLogoFile,
  };
};
