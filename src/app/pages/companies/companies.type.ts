import type { CompanyTableRow } from '~/app/components/appsec/companyTable';

export interface CompaniesProps {
  companies: CompanyTableRow[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateCompany?: () => void;
  onCompanyClick?: (company: CompanyTableRow) => void;
}
