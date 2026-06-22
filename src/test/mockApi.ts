import { vi } from 'vitest';

export interface MockApiRequest {
  routeKey: string;
  method: string;
  path: string;
  url: string;
  headers: Headers;
  bodyText?: string;
  json<T = unknown>(): T | undefined;
}

export interface MockApiResponse {
  status?: number;
  headers?: HeadersInit;
  body?: unknown;
}

export type MockApiHandler =
  | MockApiResponse
  | ((request: MockApiRequest) => MockApiResponse | Promise<MockApiResponse>);

export type MockApiRoutes = Record<string, MockApiHandler>;

const normalizeRouteKey = (routeKey: string) => {
  const match = routeKey.trim().match(/^([a-z]+)\s+(.+)$/i);

  if (!match) {
    throw new Error(
      `Invalid mock API route "${routeKey}". Expected "METHOD /path".`,
    );
  }

  return `${match[1].toUpperCase()} ${match[2]}`;
};

const isRequest = (input: RequestInfo | URL): input is Request =>
  typeof Request !== 'undefined' && input instanceof Request;

const isUrl = (input: RequestInfo | URL): input is URL =>
  typeof URL !== 'undefined' && input instanceof URL;

const getRequestUrl = (input: RequestInfo | URL) => {
  if (isRequest(input)) {
    return input.url;
  }

  if (isUrl(input)) {
    return input.toString();
  }

  return String(input);
};

const getRequestBody = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof init?.body === 'string') {
    return init.body;
  }

  if (isRequest(input) && init?.body === undefined) {
    const body = await input.clone().text();

    return body || undefined;
  }

  return undefined;
};

const getRequestHeaders = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(isRequest(input) ? input.headers : undefined);
  const additionalHeaders = new Headers(init?.headers);

  additionalHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
};

const createMockResponse = ({
  status = 200,
  headers: initialHeaders,
  body,
}: MockApiResponse) => {
  const headers = new Headers(initialHeaders);

  if (body === undefined) {
    return new Response(null, { status, headers });
  }

  if (typeof body === 'string') {
    return new Response(body, { status, headers });
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
};

export const mockApi = (routes: MockApiRoutes) => {
  const handlers = new Map(
    Object.entries(routes).map(([routeKey, handler]) => [
      normalizeRouteKey(routeKey),
      handler,
    ]),
  );

  const usage = new Map<string, number>();
  const requests: MockApiRequest[] = [];

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const rawUrl = getRequestUrl(input);
      const url = new URL(rawUrl, window.location.origin);
      const method = (
        init?.method ?? (isRequest(input) ? input.method : 'GET')
      ).toUpperCase();

      const path = `${url.pathname}${url.search}`;
      const routeKey = `${method} ${path}`;
      const bodyText = await getRequestBody(input, init);

      const request: MockApiRequest = {
        routeKey,
        method,
        path,
        url: url.toString(),
        headers: getRequestHeaders(input, init),
        bodyText,
        json<T = unknown>() {
          if (!bodyText) {
            return undefined;
          }

          return JSON.parse(bodyText) as T;
        },
      };

      requests.push(request);

      const handler = handlers.get(routeKey);

      if (!handler) {
        throw new Error(`Unexpected API request: ${routeKey}`);
      }

      usage.set(routeKey, (usage.get(routeKey) ?? 0) + 1);

      const response =
        typeof handler === 'function' ? await handler(request) : handler;

      return createMockResponse(response);
    },
  );

  vi.stubGlobal('fetch', fetchMock);

  return {
    fetchMock,
    requests,

    request(routeKey: string, occurrence = 0) {
      const normalizedRouteKey = normalizeRouteKey(routeKey);
      const matches = requests.filter(
        request => request.routeKey === normalizedRouteKey,
      );

      const request = matches[occurrence];

      if (!request) {
        throw new Error(
          `No captured request for ${normalizedRouteKey} at occurrence ${occurrence}.`,
        );
      }

      return request;
    },

    requestCount(routeKey: string) {
      const normalizedRouteKey = normalizeRouteKey(routeKey);

      return requests.filter(request => request.routeKey === normalizedRouteKey)
        .length;
    },

    verifyAllHandlersUsed() {
      const unusedRoutes = Array.from(handlers.keys()).filter(
        routeKey => (usage.get(routeKey) ?? 0) === 0,
      );

      if (unusedRoutes.length > 0) {
        throw new Error(`Unused mock API routes: ${unusedRoutes.join(', ')}`);
      }
    },
  };
};
