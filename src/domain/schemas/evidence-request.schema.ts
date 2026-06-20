import path from 'node:path';
import { z } from 'zod';

import { evidenceObjectSchema } from './evidence.schema.js';
import {
  nonNegativeIntegerSchema,
  optionalTrimmedTextSchema,
} from './common.schema.js';

const supportedEvidenceMimeTypes = [
  'application/json',
  'application/pdf',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
] as const;

const supportedEvidenceFileExtensionsByMimeType: Record<
  (typeof supportedEvidenceMimeTypes)[number],
  readonly string[]
> = {
  'application/json': ['.json'],
  'application/pdf': ['.pdf'],
  'image/gif': ['.gif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'text/plain': ['.txt'],
};

export type SupportedEvidenceMimeType =
  (typeof supportedEvidenceMimeTypes)[number];

const isSafeEvidenceFileName = (value: string): boolean =>
  !/[\\/:<>"|?*\0]/.test(value) && value !== '.' && value !== '..';

export const isEvidenceFileNameCompatibleWithMimeType = (
  fileName: string,
  mimeType: SupportedEvidenceMimeType,
): boolean => {
  const extension = path.extname(fileName).toLowerCase();
  const allowedExtensions = supportedEvidenceFileExtensionsByMimeType[mimeType];

  return allowedExtensions.includes(extension);
};

const evidenceFileNameSchema = optionalTrimmedTextSchema.refine(
  value => value === undefined || isSafeEvidenceFileName(value),
  'Evidence file name must not contain path separators',
);

const evidenceMimeTypeSchema = z.enum(supportedEvidenceMimeTypes).optional();
const evidenceAttachmentSizeBytesSchema = nonNegativeIntegerSchema.refine(
  value => value <= 5 * 1024 * 1024,
  'Evidence attachment must be 5 MB or smaller',
);

export const evidenceRequestBaseSchema = evidenceObjectSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    filePath: true,
    storageKey: true,
  })
  .extend({
    fileName: evidenceFileNameSchema,
    mimeType: evidenceMimeTypeSchema,
    attachmentSizeBytes: evidenceAttachmentSizeBytesSchema.optional(),
  });

export const validateEvidenceFileMetadata = (
  value: {
    fileName?: string;
    mimeType?: (typeof supportedEvidenceMimeTypes)[number];
  },
  ctx: z.RefinementCtx,
) => {
  if (
    value.fileName &&
    value.mimeType &&
    !isEvidenceFileNameCompatibleWithMimeType(value.fileName, value.mimeType)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fileName'],
      message: 'Evidence file name extension must match the supplied mime type',
    });
  }
};

export const validateEvidenceExchanges = (
  value: {
    type?: string;
    httpExchanges?: Array<unknown>;
  },
  ctx: z.RefinementCtx,
  options: {
    allowExplicitEmptyHttpExchanges: boolean;
  },
) => {
  if (
    !options.allowExplicitEmptyHttpExchanges &&
    value.httpExchanges !== undefined &&
    value.httpExchanges.length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['httpExchanges'],
      message: 'HTTP evidence must include at least one exchange',
    });
    return;
  }

  const hasHttpExchanges = value.httpExchanges !== undefined;

  if (value.type === 'http') {
    if (!hasHttpExchanges) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['httpExchanges'],
        message: 'HTTP evidence must include at least one exchange',
      });
    }

    return;
  }

  if (value.type !== undefined && hasHttpExchanges) {
    if (
      options.allowExplicitEmptyHttpExchanges &&
      value.httpExchanges?.length === 0
    ) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['httpExchanges'],
      message: 'Only HTTP evidence can include exchanges',
    });
  }
};
