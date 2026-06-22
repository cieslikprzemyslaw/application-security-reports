import type { Evidence, EvidenceHttpExchange } from '~/domain';

export const buildHttpExchange = (
  overrides: Partial<EvidenceHttpExchange> = {},
): EvidenceHttpExchange => {
  const { headers: requestHeaders, ...requestProperties } =
    overrides.request ?? {};

  const { headers: responseHeaders, ...responseProperties } =
    overrides.response ?? {};

  return {
    request: {
      method: 'GET',
      url: 'https://example.com/api/accounts/123',
      ...requestProperties,
      headers: requestHeaders
        ? { ...requestHeaders }
        : {
            Accept: 'application/json',
          },
    },
    response: {
      statusCode: 200,
      statusText: 'OK',
      body: '{"id":"123"}',
      ...responseProperties,
      headers: responseHeaders
        ? { ...responseHeaders }
        : {
            'Content-Type': 'application/json',
          },
    },
  };
};

export const buildEvidence = (overrides: Partial<Evidence> = {}): Evidence => {
  const { threatIds = [], httpExchanges, ...properties } = overrides;

  return {
    id: 'evd_test',
    assessmentId: 'asm_test',
    type: 'text',
    title: 'Authorization test evidence',
    description: 'Evidence captured during manual testing.',
    content: 'The endpoint returned another user account.',
    capturedAt: '2026-01-03',
    createdAt: '2026-01-03T09:00:00.000Z',
    updatedAt: '2026-01-03T10:00:00.000Z',
    ...properties,
    threatIds: [...threatIds],
    httpExchanges: httpExchanges?.map(exchange => buildHttpExchange(exchange)),
  };
};
