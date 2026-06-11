import { z } from 'zod';

import type { Company } from '../company.js';

import {
  nonEmptyIdSchema,
  nonEmptyTextSchema,
  optionalEmailSchema,
  optionalTrimmedTextSchema,
  optionalUrlSchema,
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

export const companiesFileSchema = z.array(companySchema);
