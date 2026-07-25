import {
  getCweCatalogEntry,
  isCweCatalogVersion,
  normalizeCweId,
  type CweCatalogVersion,
} from '../../../src/domain/cwe.js';
import type { ThreatCweMapping } from '../../../src/domain/threat.js';
import { ValidationError } from '../../../src/validation/index.js';

export interface AssessmentThreatTaxonomyRow {
  owaspTaxonomyVersion: string;
  cweCatalogVersion: string;
}

export interface ThreatCweRow {
  cweId: string;
  position: number;
}

const cweValidationError = (path: string, message: string) =>
  new ValidationError({
    error: 'VALIDATION_ERROR',
    fields: [{ path, message, code: 'custom' }],
  });

export const parseAssessmentCweCatalogVersion = (
  assessment: Pick<AssessmentThreatTaxonomyRow, 'cweCatalogVersion'>,
): CweCatalogVersion => {
  if (!isCweCatalogVersion(assessment.cweCatalogVersion)) {
    throw cweValidationError(
      'cweCatalogVersion',
      `Unsupported CWE catalog version: ${assessment.cweCatalogVersion}`,
    );
  }

  return assessment.cweCatalogVersion;
};

export const validateNewThreatCweIds = (
  values: string[] | undefined,
  version: CweCatalogVersion,
): string[] => {
  if (values === undefined) return [];
  if (!Array.isArray(values)) {
    throw cweValidationError('cweIds', 'CWE mappings must be an array.');
  }
  if (values.length > 5) {
    throw cweValidationError(
      'cweIds',
      'A Threat can contain at most five CWE mappings.',
    );
  }

  const normalized = values.map((value, index) => {
    const id = typeof value === 'string' ? normalizeCweId(value) : undefined;
    if (!id) {
      throw cweValidationError(
        `cweIds.${index}`,
        'CWE ID must use the CWE-123 format.',
      );
    }
    return id;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw cweValidationError(
      'cweIds',
      'CWE mappings must not contain duplicates.',
    );
  }

  normalized.forEach((id, index) => {
    const entry = getCweCatalogEntry(id, version);
    if (!entry) {
      throw cweValidationError(
        `cweIds.${index}`,
        `Unknown CWE ID in catalog ${version}: ${id}.`,
      );
    }
    if (entry.deprecated) {
      throw cweValidationError(
        `cweIds.${index}`,
        `Deprecated CWE IDs cannot be selected for new mappings: ${id}.`,
      );
    }
  });

  return normalized;
};

export const toOrderedThreatCweLinks = (cweIds: string[]) =>
  cweIds.map((cweId, position) => ({ cweId, position }));

export const toThreatCweMappings = (
  rows: ThreatCweRow[],
  version: CweCatalogVersion,
): ThreatCweMapping[] =>
  [...rows]
    .sort(
      (left, right) =>
        left.position - right.position || left.cweId.localeCompare(right.cweId),
    )
    .map((row, index) => {
      const entry = getCweCatalogEntry(row.cweId, version);
      if (!entry) {
        throw cweValidationError(
          'cweMappings',
          `Stored CWE ID is unavailable in catalog ${version}: ${row.cweId}.`,
        );
      }

      return {
        id: entry.id,
        name: entry.name,
        status: entry.status,
        deprecated: entry.deprecated,
        primary: index === 0,
        replacementIds: [...entry.replacementIds],
      };
    });
