import React from 'react';

import CompanyTable from '~/app/components/appsec/companyTable';
import FilterToolbar from '~/app/components/common/filterToolbar';
import PageHeader from '~/app/components/common/pageHeader';
import Button from '~/app/components/ui/button';
import SearchInput from '~/app/components/ui/searchInput';

import StyledPage, { PageCard } from './companies.styled';

import type { CompaniesProps } from './companies.type';

const Companies = ({
  companies,
  searchValue,
  onSearchChange,
  onCreateCompany,
  onCompanyClick,
}: CompaniesProps) => {
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <StyledPage>
      <PageHeader
        eyebrow="Workspace"
        title="Companies"
        subtitle={
          'Manage organisations and the assessments associated with them.'
        }
        actions={
          onCreateCompany ? (
            <Button title="New company" onClick={onCreateCompany} />
          ) : undefined
        }
      />

      <PageCard>
        <FilterToolbar
          search={
            <SearchInput
              value={searchValue}
              placeholder="Search companies..."
              onChange={event => onSearchChange(event.target.value)}
              onClear={() => onSearchChange('')}
            />
          }
          summary={`${filteredCompanies.length} companies`}
        />

        <CompanyTable
          companies={filteredCompanies}
          onCompanyClick={onCompanyClick}
          emptyState={'No companies found.'}
        />
      </PageCard>
    </StyledPage>
  );
};

export default Companies;
