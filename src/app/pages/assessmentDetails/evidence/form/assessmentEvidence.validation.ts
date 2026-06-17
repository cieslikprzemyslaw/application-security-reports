import type { ValidationFieldError } from '~/validation';

import type { EvidenceFormErrors } from './assessmentEvidence.types';
import type { EvidenceFormValue } from './assessmentEvidence.mapper';

const evidenceFieldAliases: Record<
  string,
  Exclude<keyof EvidenceFormErrors, 'exchangeErrors'>
> = {
  type: 'type',
  title: 'title',
  description: 'description',
  content: 'content',
  capturedAt: 'capturedAt',
  threatIds: 'threatIds',
  fileName: 'attachment',
  mimeType: 'attachment',
  attachmentSizeBytes: 'attachment',
  httpExchanges: 'httpExchanges',
};

const mapExchangeField = (pathSegments: string[]) => {
  const [, , section, field] = pathSegments;

  if (section === 'request') {
    if (field === 'method') {
      return 'requestMethod';
    }

    if (field === 'url') {
      return 'requestUrl';
    }

    if (field === 'body') {
      return 'requestBody';
    }
  }

  if (section === 'response') {
    if (field === 'statusCode') {
      return 'responseStatusCode';
    }

    if (field === 'statusText') {
      return 'responseStatusText';
    }

    if (field === 'body') {
      return 'responseBody';
    }
  }

  return undefined;
};

export interface EvidenceValidationErrorMap {
  fieldErrors: EvidenceFormErrors;
  generalErrors: string[];
}

export const createEmptyEvidenceFormErrors = (): EvidenceFormErrors => ({
  exchangeErrors: {},
});

export const createEvidenceValidationErrorMap = (
  details: ValidationFieldError[],
  value: EvidenceFormValue,
): EvidenceValidationErrorMap => {
  const fieldErrors: EvidenceFormErrors = {
    exchangeErrors: {},
  };
  const generalErrors: string[] = [];

  for (const detail of details) {
    const pathSegments = detail.path.split('.').filter(Boolean);
    const root = pathSegments[0] ?? '';

    if (root === 'httpExchanges' && pathSegments.length > 1) {
      const exchangeIndex = Number.parseInt(pathSegments[1] ?? '', 10);
      const exchange = value.httpExchanges[exchangeIndex];

      if (!Number.isInteger(exchangeIndex) || !exchange) {
        generalErrors.push(detail.message);
        continue;
      }

      const exchangeField = mapExchangeField(pathSegments);

      if (!exchangeField) {
        const nextExchangeError =
          fieldErrors.exchangeErrors[exchange.localId] ?? {};

        fieldErrors.exchangeErrors[exchange.localId] = {
          ...nextExchangeError,
          general: nextExchangeError.general ?? detail.message,
        };
        continue;
      }

      const nextExchangeError =
        fieldErrors.exchangeErrors[exchange.localId] ?? {};

      if (!nextExchangeError[exchangeField]) {
        fieldErrors.exchangeErrors[exchange.localId] = {
          ...nextExchangeError,
          [exchangeField]: detail.message,
        };
      }

      continue;
    }

    const fieldName = evidenceFieldAliases[root];

    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return {
    fieldErrors,
    generalErrors,
  };
};
