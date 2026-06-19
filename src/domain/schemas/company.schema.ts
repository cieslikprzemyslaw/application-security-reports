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

export const companyObjectSchema = z
  .object({
    id: nonEmptyIdSchema,
    name: nonEmptyTextSchema,
    description: optionalTrimmedTextSchema,
    website: optionalUrlSchema,
    contactName: optionalTrimmedTextSchema,
    contactEmail: optionalEmailSchema,
    logoPath: optionalTrimmedTextSchema,
    logoUrl: urlSchema.nullable().optional(),
    footerText: optionalTrimmedTextSchema,
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
    logoUrl: urlSchema.nullable(),
    footerText: optionalTrimmedTextSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const companiesFileSchema = z.array(companySchema);
