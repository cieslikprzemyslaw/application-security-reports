import type { ApiRequestOptions } from './apiClient.js';

export type ApiRequestFn = <T>(
  input: RequestInfo | URL,
  init?: ApiRequestOptions,
) => Promise<T | undefined>;

export const requestData = async <T>(
  request: ApiRequestFn,
  input: RequestInfo | URL,
  init?: ApiRequestOptions,
): Promise<T> => {
  const response = await request<{ data: T }>(input, init);

  if (!response) {
    throw new Error('Expected the API request to return data.');
  }

  return response.data;
};
