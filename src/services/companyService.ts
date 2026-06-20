import type {
  AssessmentStatus,
  Company,
  CompanyListItem,
  Severity,
} from '~/domain';

import { apiRequest } from './apiClient.js';
import { requestData, type ApiRequestFn } from './serviceHelpers.js';

export type CompanyCreateInput = Omit<
  Company,
  'id' | 'createdAt' | 'updatedAt' | 'logoUrl'
>;

export type CompanyUpdateInput = Partial<CompanyCreateInput>;

export interface CompanyOverviewAssessmentCounts {
  total: number;
  draft: number;
  inProgress: number;
  completed: number;
}

export interface CompanyOverviewRecentAssessment {
  id: string;
  applicationName: string;
  companyName: string;
  assessmentType: string;
  severity: Severity;
  findingsCount: number;
  status: AssessmentStatus;
}

export interface CompanyOverviewRecentReport {
  id: string;
  companyName: string;
  assessmentName: string;
  reportType: string;
  status: string;
  generatedAt?: string;
  updatedAt: string;
}

export interface CompanyOverviewResponse {
  company: Company;
  assessmentCounts: CompanyOverviewAssessmentCounts;
  recentAssessments: CompanyOverviewRecentAssessment[];
  recentReports?: CompanyOverviewRecentReport[] | null;
}

export interface CompanyService {
  list(signal?: AbortSignal): Promise<CompanyListItem[]>;
  getById(companyId: string, signal?: AbortSignal): Promise<Company>;
  getOverview(
    companyId: string,
    signal?: AbortSignal,
  ): Promise<CompanyOverviewResponse>;
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

  async getOverview(companyId, signal) {
    return requestData<CompanyOverviewResponse>(
      request,
      `/api/companies/${companyId}/overview`,
      {
        method: 'GET',
        signal,
      },
    );
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
