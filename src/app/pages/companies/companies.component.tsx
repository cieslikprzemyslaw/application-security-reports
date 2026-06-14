import React from 'react';

import CompanyTable from '~/app/components/appsec/companyTable';
import FilterToolbar from '~/app/components/common/filterToolbar';
import PageHeader from '~/app/components/common/pageHeader';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import SearchInput from '~/app/components/ui/searchInput';

import StyledCompanies from './companies.styled';

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
  const hasSearchQuery = searchValue.trim().length > 0;
  const showEmptyWorkspace = companies.length === 0;
  const showNoResults = !showEmptyWorkspace && filteredCompanies.length === 0;

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      title="No companies yet"
      description="Add a company to group assessments and findings in one place."
      primaryAction={
        onCreateCompany ? (
          <Button title="New company" onClick={onCreateCompany} />
        ) : undefined
      }
    />
  ) : showNoResults ? (
    <EmptyState
      title={
        hasSearchQuery
          ? `No companies match "${searchValue.trim()}"`
          : 'No companies match your filters'
      }
      description="Clear the search to show all companies again."
      primaryAction={
        <Button
          title="Clear search"
          variant="secondary"
          onClick={() => onSearchChange('')}
        />
      }
    />
  ) : undefined;

  return (
    <StyledCompanies>
      <PageHeader
        eyebrow="Workspace"
        title="Companies"
        subtitle="Manage organisations and the assessments associated with them."
        actions={
          onCreateCompany ? (
            <Button title="New company" onClick={onCreateCompany} />
          ) : undefined
        }
      />

      <section className="companies-card">
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
          emptyState={emptyState}
        />
      </section>
    </StyledCompanies>
  );
};

export default Companies;
