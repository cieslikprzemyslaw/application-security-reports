import type { ValidationFieldError } from '~/validation';

export type ApiQueryPrimitive = string | number | boolean;

export type ApiQueryValue =
  | ApiQueryPrimitive
  | null
  | undefined
  | readonly (ApiQueryPrimitive | null | undefined)[];

export type ApiQueryParams = Record<string, ApiQueryValue>;

export interface ApiRequestOptions<TBody = unknown> {
  body?: TBody;
  baseUrl?: string;
  headers?: HeadersInit;
  method?: string;
  query?: ApiQueryParams;
  rawBody?: BodyInit;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: ValidationFieldError[] = [],
    public readonly code?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

export class ApiNetworkError extends Error {
  constructor(message = 'Network request failed', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiNetworkError';
  }
}

export class ApiAbortError extends Error {
  constructor(message = 'The request was aborted.', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiAbortError';
  }
}

export class ApiResponseParseError extends Error {
  constructor(
    message = 'Unable to parse the API response.',
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiResponseParseError';
  }
}

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const splitUrlSuffix = (value: string) => {
  const queryIndex = value.indexOf('?');
  const hashIndex = value.indexOf('#');

  if (queryIndex === -1 && hashIndex === -1) {
    return {
      path: value,
      suffix: '',
    };
  }

  if (queryIndex === -1) {
    return {
      path: value.slice(0, hashIndex),
      suffix: value.slice(hashIndex),
    };
  }

  if (hashIndex === -1 || queryIndex < hashIndex) {
    return {
      path: value.slice(0, queryIndex),
      suffix: value.slice(queryIndex),
    };
  }

  return {
    path: value.slice(0, hashIndex),
    suffix: value.slice(hashIndex),
  };
};

const normalizePath = (value: string) => {
  const { path, suffix } = splitUrlSuffix(value.trim());
  return `/${path.replace(/^\/+/, '')}${suffix}`;
};

const normalizeBaseUrl = (value?: string) =>
  value?.trim().replace(/\/+$/, '') ?? '';

const buildRequestUrl = (
  input: RequestInfo | URL,
  baseUrl?: string,
  query?: ApiQueryParams,
) => {
  const requestTarget =
    input instanceof URL
      ? input.toString()
      : input instanceof Request
        ? input.url
        : String(input).trim();

  const targetUrl =
    input instanceof URL || isAbsoluteUrl(requestTarget)
      ? requestTarget
      : `${normalizeBaseUrl(baseUrl)}${normalizePath(requestTarget)}`;

  const queryString = serializeQueryParams(query);

  if (queryString.length === 0) {
    return targetUrl;
  }

  const hashIndex = targetUrl.indexOf('#');

  if (hashIndex === -1) {
    return `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${queryString}`;
  }

  const urlWithoutHash = targetUrl.slice(0, hashIndex);
  const hash = targetUrl.slice(hashIndex);

  return `${urlWithoutHash}${
    urlWithoutHash.includes('?') ? '&' : '?'
  }${queryString}${hash}`;
};

const serializeQueryParams = (query?: ApiQueryParams) => {
  const params = new URLSearchParams();

  if (!query) {
    return params.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }

        params.append(key, String(item));
      }

      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeValidationFieldErrors = (
  value: unknown,
): ValidationFieldError[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const errors: ValidationFieldError[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }

    if (typeof item.path !== 'string' || typeof item.message !== 'string') {
      continue;
    }

    const error: ValidationFieldError = {
      path: item.path,
      message: item.message,
    };

    if (typeof item.code === 'string') {
      error.code = item.code;
    }

    errors.push(error);
  }

  return errors;
};

const parseHttpErrorPayload = (text: string) => {
  if (text.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(text);

    if (!isRecord(parsed) || !isRecord(parsed.error)) {
      return undefined;
    }

    const { error } = parsed;
    const message =
      typeof error.message === 'string' && error.message.trim().length > 0
        ? error.message
        : undefined;
    const code =
      typeof error.code === 'string' && error.code.trim().length > 0
        ? error.code
        : undefined;
    const details = normalizeValidationFieldErrors(
      error.details ?? error.fields,
    );

    return {
      code,
      details,
      message,
    };
  } catch {
    return undefined;
  }
};

const isAbortLikeError = (error: unknown) => {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      error.name === 'RequestAbortedError' ||
      error.message === 'The operation was aborted.')
  );
};

const readResponseText = async (response: Response) => {
  if (response.status === 204) {
    return '';
  }

  return response.text();
};

export const apiRequest = async <T>(
  input: RequestInfo | URL,
  init: ApiRequestOptions = {},
): Promise<T | undefined> => {
  if (init.signal?.aborted) {
    throw new ApiAbortError();
  }

  const requestUrl = buildRequestUrl(
    input,
    init.baseUrl ?? import.meta.env?.VITE_API_BASE_URL,
    init.query,
  );
  const requestHeaders = new Headers(init.headers);

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  const hasJsonBody = init.body !== undefined;
  const hasRawBody = init.rawBody !== undefined;

  if (hasJsonBody && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const method = init.method ?? (hasJsonBody || hasRawBody ? 'POST' : 'GET');

  const requestInit: RequestInit = {
    headers: requestHeaders,
    method,
    signal: init.signal,
  };

  if (hasJsonBody) {
    requestInit.body = JSON.stringify(init.body);
  } else if (hasRawBody) {
    requestInit.body = init.rawBody;
  }

  let response: Response;

  try {
    response = await fetch(requestUrl, requestInit);
  } catch (error) {
    if (isAbortLikeError(error) || init.signal?.aborted) {
      throw new ApiAbortError(undefined, {
        cause: error,
      });
    }

    throw new ApiNetworkError(undefined, {
      cause: error,
    });
  }

  const responseText = await readResponseText(response);

  if (response.ok) {
    if (response.status === 204 || responseText.trim().length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (error) {
      throw new ApiResponseParseError(undefined, response.status, {
        cause: error,
      });
    }
  }

  const parsedError = parseHttpErrorPayload(responseText);

  throw new ApiError(
    parsedError?.message ?? `API request failed with status ${response.status}`,
    response.status,
    parsedError?.details ?? [],
    parsedError?.code,
  );
};
