import { z } from 'zod';

import type { Company } from '../company.js';

import {
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  optionalEmailSchema,
  optionalTrimmedTextSchema,
  optionalUrlSchema,
  urlSchema,
  timestampSchema,
} from './common.schema.js';

const companyLogoPublicUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    value =>
      value.startsWith('/api/companies/') || urlSchema.safeParse(value).success,
    'Company logo URL must be a safe public API path or absolute URL',
  );

export const companyObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    name: nonEmptyTextSchema,
    description: optionalTrimmedTextSchema,
    website: optionalUrlSchema,
    contactName: optionalTrimmedTextSchema,
    contactEmail: optionalEmailSchema,
    logoUrl: urlSchema.nullable().optional(),
    footerText: optionalTrimmedTextSchema,
    archivedAt: timestampSchema.nullable().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const companySchema = companyObjectSchema;

type CompanySchemaOutput = Required<z.output<typeof companySchema>>;
const _companySchemaCompatibilityCheck: CompanySchemaOutput extends Company
  ? true
  : never = true;

export const companyPublicSchema = z
  .object({
    id: nonEmptyIdSchema,
    name: nonEmptyTextSchema,
    description: optionalTrimmedTextSchema,
    website: optionalUrlSchema,
    contactName: optionalTrimmedTextSchema,
    contactEmail: optionalEmailSchema,
    logoUrl: companyLogoPublicUrlSchema.nullable(),
    footerText: optionalTrimmedTextSchema,
    archivedAt: timestampSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const companiesFileSchema = z.array(companySchema);
