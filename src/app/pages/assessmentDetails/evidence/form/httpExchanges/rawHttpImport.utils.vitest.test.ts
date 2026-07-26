import { describe, expect, it } from 'vitest';

import { parseRawHttpExchange } from '~/utils/httpParser';

import type { EvidenceHttpExchangeFormValue } from '../EvidenceForm.mapper';
import {
  applyRawHttpImport,
  hasRawHttpImportConflicts,
} from './rawHttpImport.utils';

const emptyExchange = (): EvidenceHttpExchangeFormValue => ({
  localId: 'evidence-exchange-test',
  requestMethod: '',
  requestUrl: '',
  requestBody: '',
  responseStatusCode: '',
  responseStatusText: '',
  responseBody: '',
  rawRequest: '',
  rawResponse: '',
});

const parsedExchange = () =>
  parseRawHttpExchange(
    'POST /api/orders HTTP/1.1\r\nHost: example.test\r\nContent-Type: application/json\r\n\r\n{"id":1}',
    'HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n\r\n{"ok":true}',
  );

describe('raw HTTP Evidence import mapping', () => {
  it('maps supported fields and preserves original raw text', () => {
    const result = parsedExchange();
    const nextExchange = applyRawHttpImport(emptyExchange(), result);

    expect(result.errors).toEqual([]);
    expect(nextExchange).toMatchObject({
      requestMethod: 'POST',
      requestUrl: '/api/orders',
      requestBody: '{"id":1}',
      responseStatusCode: '201',
      responseStatusText: 'Created',
      responseBody: '{"ok":true}',
    });
    expect(nextExchange.rawRequest).toContain('Host: example.test');
    expect(nextExchange.rawResponse).toContain('HTTP/1.1 201 Created');
  });

  it('requires overwrite confirmation only when populated values differ', () => {
    const result = parsedExchange();
    const matchingExchange = {
      ...emptyExchange(),
      requestMethod: 'POST',
      requestUrl: '/api/orders',
    };
    const conflictingExchange = {
      ...matchingExchange,
      requestUrl: '/api/other',
    };

    expect(hasRawHttpImportConflicts(matchingExchange, result)).toBe(false);
    expect(hasRawHttpImportConflicts(conflictingExchange, result)).toBe(true);
  });
});
