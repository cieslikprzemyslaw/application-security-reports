import type { CompanyListItem } from '~/domain';

export interface CompanyIdentity {
  id: string;
  name: string;
}

export interface CompaniesProps {
  activeCompany?: CompanyIdentity;
  onActiveCompanyChange?: (company?: CompanyIdentity) => void;
  onCompaniesChange?: (companies: CompanyListItem[]) => void;
}
