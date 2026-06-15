export interface CompanyIdentity {
  id: string;
  name: string;
}

export interface CompaniesProps {
  activeCompany?: CompanyIdentity;
  onActiveCompanyChange?: (company?: CompanyIdentity) => void;
}
