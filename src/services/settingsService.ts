import type { Settings } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type SettingsUpdateInput = Partial<
  Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface SettingsService {
  get(signal?: AbortSignal): Promise<Settings>;
  update(input: SettingsUpdateInput): Promise<Settings>;
}

export const createSettingsService = (
  request: ApiRequestFn = apiRequest,
): SettingsService => ({
  async get(signal) {
    return requestData<Settings>(request, '/api/settings', {
      method: 'GET',
      signal,
    });
  },

  async update(input) {
    return requestData<Settings>(request, '/api/settings', {
      body: input,
      method: 'PATCH',
    });
  },
});

export const settingsService = createSettingsService();
