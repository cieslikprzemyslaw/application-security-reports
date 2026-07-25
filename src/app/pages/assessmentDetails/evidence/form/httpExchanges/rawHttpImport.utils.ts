import type { HttpExchangeParseResult } from '~/utils/httpParser';

import type { EvidenceHttpExchangeFormValue } from '../EvidenceForm.mapper';

const importedFields = [
  'requestMethod',
  'requestUrl',
  'requestBody',
  'responseStatusCode',
  'responseStatusText',
  'responseBody',
] as const;

type ImportedField = (typeof importedFields)[number];

const parsedFieldValues = (
  result: HttpExchangeParseResult,
): Record<ImportedField, string> => ({
  requestMethod: result.request?.method ?? '',
  requestUrl: result.request?.target ?? '',
  requestBody: result.request?.body ?? '',
  responseStatusCode: result.response ? String(result.response.statusCode) : '',
  responseStatusText: result.response?.reasonPhrase ?? '',
  responseBody: result.response?.body ?? '',
});

export const hasRawHttpImportConflicts = (
  exchange: EvidenceHttpExchangeFormValue,
  result: HttpExchangeParseResult,
) => {
  const parsedValues = parsedFieldValues(result);

  return importedFields.some(field => {
    const currentValue = exchange[field].trim();
    const importedValue = parsedValues[field].trim();

    return (
      currentValue.length > 0 &&
      importedValue.length > 0 &&
      currentValue !== importedValue
    );
  });
};

export const applyRawHttpImport = (
  exchange: EvidenceHttpExchangeFormValue,
  result: HttpExchangeParseResult,
): EvidenceHttpExchangeFormValue => {
  const parsedValues = parsedFieldValues(result);

  return {
    ...exchange,
    ...parsedValues,
    rawRequest: result.request?.raw ?? exchange.rawRequest,
    rawResponse: result.response?.raw ?? '',
  };
};
