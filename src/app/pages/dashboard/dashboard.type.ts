import type { CompanyListItem } from '~/domain';

export type DashboardPeriod = '90' | '30' | 'all';
export type RecentCompanyIdentity = Pick<CompanyListItem, 'id' | 'name'>;

export interface DashboardStats {
  totalAssessments: number;
  totalAssessmentsChange: number;
  openThreats: number;
  openThreatsChange: number;
  criticalHighFindings: number;
  criticalHighChange: number;
  retestRequired: number;
  retestRequiredChange: number;
}

export interface RecentCompanyLatestAssessment {
  id?: string;
  name: string;
  status?: string;
  updatedAt?: string;
}

export interface RecentCompanyItem extends RecentCompanyIdentity {
  assessmentCount: number;
  lastOpenedAt?: string;
  latestAssessment?: RecentCompanyLatestAssessment;
}

export interface DashboardProps {
  companies: RecentCompanyItem[];
  isWorkspaceEmpty?: boolean;
  onCreateCompany?: () => void;
  onOpenCompany?: (company: RecentCompanyIdentity) => void;
}
