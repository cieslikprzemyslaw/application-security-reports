import assert from 'node:assert/strict';

import {
  ApiAbortError,
  ApiError,
  ApiNetworkError,
  ApiResponseParseError,
  apiRequest,
} from './apiClient.js';

type FetchRecord = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

const originalFetch = globalThis.fetch;

const setFetch = (value: typeof fetch) => {
  Object.defineProperty(globalThis, 'fetch', {
    value,
    configurable: true,
    writable: true,
  });
};

const restoreFetch = () => {
  setFetch(originalFetch);
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });

await (async () => {
  {
    const calls: FetchRecord[] = [];

    setFetch(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ data: { ok: true } });
    });

    try {
      const result = await apiRequest<{ data: { ok: boolean } }>('companies', {
        baseUrl: 'https://api.example.com/',
        headers: {
          'X-Trace-Id': 'trace-123',
        },
        query: {
          active: false,
          omit: null,
          page: 0,
          search: 'a b',
          skip: undefined,
          tags: ['alpha', null, undefined, 'beta'],
        },
      });

      assert.deepEqual(result, { data: { ok: true } });
      assert.equal(calls.length, 1);

      const call = calls[0];
      assert.ok(call);
      assert.equal(
        String(call.input),
        'https://api.example.com/companies?active=false&page=0&search=a+b&tags=alpha&tags=beta',
      );

      const headers = new Headers(call.init?.headers);
      assert.equal(headers.get('Accept'), 'application/json');
      assert.equal(headers.get('Content-Type'), null);
      assert.equal(headers.get('X-Trace-Id'), 'trace-123');
      assert.equal(call.init?.method, 'GET');
    } finally {
      restoreFetch();
    }
  }

  {
    const calls: FetchRecord[] = [];

    setFetch(async (input, init) => {
      calls.push({ input, init });
      return createJsonResponse({ data: { id: 'cmp_1' } });
    });

    try {
      const result = await apiRequest<{ data: { id: string } }>('/companies', {
        body: { name: 'Northstar Digital' },
        headers: {
          'X-Request-Id': 'req-123',
        },
        method: 'POST',
      });

      assert.deepEqual(result, { data: { id: 'cmp_1' } });
      assert.equal(calls.length, 1);

      const call = calls[0];
      assert.ok(call);
      assert.equal(String(call.input), '/companies');
      assert.equal(
        call.init?.body,
        JSON.stringify({ name: 'Northstar Digital' }),
      );

      const headers = new Headers(call.init?.headers);
      assert.equal(headers.get('Accept'), 'application/json');
      assert.equal(headers.get('Content-Type'), 'application/json');
      assert.equal(headers.get('X-Request-Id'), 'req-123');
      assert.equal(call.init?.method, 'POST');
    } finally {
      restoreFetch();
    }
  }

  {
    const calls: FetchRecord[] = [];

    setFetch(async (input, init) => {
      calls.push({ input, init });
      return new Response(null, { status: 204 });
    });

    try {
      const noContent = await apiRequest<void>('/reports/rpt_1', {
        method: 'DELETE',
      });

      assert.equal(noContent, undefined);
      assert.equal(calls.length, 1);
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () => new Response('', { status: 200 }));

    try {
      const emptyBody = await apiRequest<void>('/settings');
      assert.equal(emptyBody, undefined);
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () =>
      createJsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: [
              {
                path: 'name',
                message: 'Required',
                code: 'invalid_type',
              },
            ],
          },
        },
        { status: 400 },
      ),
    );

    try {
      await apiRequest('/companies', {
        body: { name: '' },
        method: 'POST',
      });

      assert.fail('Expected the API request to fail');
    } catch (error) {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.message, 'Request validation failed');
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.deepEqual(error.details, [
        {
          path: 'name',
          message: 'Required',
          code: 'invalid_type',
        },
      ]);
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(
      async () => new Response('<html>Server Error</html>', { status: 500 }),
    );

    try {
      await apiRequest('/companies');

      assert.fail('Expected the API request to fail');
    } catch (error) {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 500);
      assert.equal(error.message, 'API request failed with status 500');
      assert.equal(error.code, undefined);
      assert.deepEqual(error.details, []);
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () => {
      throw new TypeError('fetch failed');
    });

    try {
      await apiRequest('/companies');

      assert.fail('Expected the API request to fail');
    } catch (error) {
      assert.ok(error instanceof ApiNetworkError);
      assert.equal(error.message, 'Network request failed');
    } finally {
      restoreFetch();
    }
  }

  {
    const controller = new AbortController();
    controller.abort();
    let callCount = 0;

    setFetch(async () => {
      callCount += 1;
      return createJsonResponse({ data: true });
    });

    try {
      await apiRequest('/companies', {
        signal: controller.signal,
      });

      assert.fail('Expected the API request to fail');
    } catch (error) {
      assert.ok(error instanceof ApiAbortError);
      assert.equal(callCount, 0);
    } finally {
      restoreFetch();
    }
  }

  {
    setFetch(async () => new Response('not json', { status: 200 }));

    try {
      await apiRequest('/companies');

      assert.fail('Expected the API request to fail');
    } catch (error) {
      assert.ok(error instanceof ApiResponseParseError);
      assert.equal(error.status, 200);
    } finally {
      restoreFetch();
    }
  }

  console.log('api client checks passed');
})();
