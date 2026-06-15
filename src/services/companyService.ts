import type { Company, CompanyListItem } from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type CompanyCreateInput = Omit<
  Company,
  'id' | 'createdAt' | 'updatedAt'
>;

export type CompanyUpdateInput = Partial<CompanyCreateInput>;

export interface CompanyService {
  list(signal?: AbortSignal): Promise<CompanyListItem[]>;
  getById(companyId: string, signal?: AbortSignal): Promise<Company>;
  create(input: CompanyCreateInput): Promise<Company>;
  update(companyId: string, input: CompanyUpdateInput): Promise<Company>;
  remove(companyId: string): Promise<void>;
}

export const createCompanyService = (
  request: ApiRequestFn = apiRequest,
): CompanyService => ({
  async list(signal) {
    return requestData<CompanyListItem[]>(request, '/api/companies', {
      method: 'GET',
      signal,
    });
  },

  async getById(companyId, signal) {
    return requestData<Company>(request, `/api/companies/${companyId}`, {
      method: 'GET',
      signal,
    });
  },

  async create(input) {
    return requestData<Company>(request, '/api/companies', {
      body: input,
      method: 'POST',
    });
  },

  async update(companyId, input) {
    return requestData<Company>(request, `/api/companies/${companyId}`, {
      body: input,
      method: 'PATCH',
    });
  },

  async remove(companyId) {
    await request(`/api/companies/${companyId}`, {
      method: 'DELETE',
    });
  },
});

export const companyService = createCompanyService();
