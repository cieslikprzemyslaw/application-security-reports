import React from 'react';
import { useNavigate } from 'react-router-dom';

import CompanyForm from '~/app/components/appsec/companyForm';
import CompanyTable from '~/app/components/appsec/companyTable';
import Callout from '~/app/components/ui/callout';
import Drawer from '~/app/components/ui/drawer';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import Pagination from '~/app/components/ui/pagination';
import SearchInput from '~/app/components/ui/searchInput';
import {
  FilterToolbar,
  PageHeader,
  PaginationSummary,
  TableFooter,
} from '~/app/components/common';
import { routes } from '~/routes';

import StyledCompanies from './companies.styled';
import type { CompaniesProps } from './companies.type';
import { companyToTableRow } from './companies.utils';
import { useCompaniesController } from './useCompaniesController';

const PAGE_SIZE = 8;

const Companies = ({
  activeCompany,
  onCompaniesChange,
  onActiveCompanyChange,
}: CompaniesProps) => {
  const navigate = useNavigate();
  const {
    filteredCompanies,
    pagedCompanies,
    totalPages,
    safePage,
    isLoading,
    loadError,
    searchValue,
    drawerMode,
    draftValue,
    fieldErrors,
    formErrorMessage,
    isSubmitting,
    selectedCompanyLogoUrl,
    showEmptyWorkspace,
    showNoResults,
    setDraftValue,
    reloadCompanies,
    requestCloseDrawer,
    handleSave,
    handleSearchChange,
    handlePageChange,
    handleCompanyClick,
    handleEditCompany,
  } = useCompaniesController({
    activeCompany,
    onCompaniesChange,
    onActiveCompanyChange,
  });

  const handleNewCompany = () => navigate(routes.companiesNew);

  const query = searchValue.toLowerCase().trim();
  const pageSummary = (
    <PaginationSummary
      currentPage={safePage}
      pageSize={PAGE_SIZE}
      totalItems={filteredCompanies.length}
      itemLabel="companies"
    />
  );

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      title="No companies yet"
      description="Add a company to start building assessments and reports."
      primaryAction={<Button title="New company" onClick={handleNewCompany} />}
    />
  ) : showNoResults ? (
    <EmptyState
      title={
        query.length > 0
          ? `No companies match "${searchValue.trim()}"`
          : 'No companies match your filters'
      }
      description="Clear the search to show all companies again."
      primaryAction={
        <Button
          title="Clear search"
          variant="secondary"
          onClick={() => handleSearchChange('')}
        />
      }
    />
  ) : undefined;

  return (
    <StyledCompanies>
      <PageHeader
        eyebrow="Workspace"
        title="Companies"
        subtitle="Manage client organisations and the assessments associated with them."
        actions={<Button title="New company" onClick={handleNewCompany} />}
      />

      <section className="companies-card">
        <FilterToolbar
          search={
            <SearchInput
              value={searchValue}
              placeholder="Search companies..."
              onChange={event => handleSearchChange(event.target.value)}
              onClear={() => handleSearchChange('')}
            />
          }
          summary={`${filteredCompanies.length} companies`}
        />

        {loadError ? (
          <div className="companies-status">
            <Callout
              variant="error"
              title="Unable to load companies"
              actions={
                <Button
                  title="Retry"
                  variant="secondary"
                  onClick={reloadCompanies}
                />
              }
            >
              <p>{loadError}</p>
            </Callout>
          </div>
        ) : isLoading ? (
          <div className="companies-status" role="status" aria-live="polite">
            Loading companies...
          </div>
        ) : (
          <>
            <CompanyTable
              companies={pagedCompanies.map(companyToTableRow)}
              activeCompanyId={activeCompany?.id}
              onCompanyClick={company => handleCompanyClick(company)}
              onEditCompany={company => handleEditCompany(company)}
              emptyState={emptyState}
            />

            {filteredCompanies.length > PAGE_SIZE && (
              <TableFooter
                summary={pageSummary}
                pagination={
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    ariaLabel="Companies pagination"
                  />
                }
              />
            )}
          </>
        )}
      </section>

      <Drawer
        isOpen={drawerMode !== null}
        title="Edit company"
        description="Update the company details used throughout the workspace."
        onClose={requestCloseDrawer}
        size="large"
      >
        <CompanyForm
          value={draftValue}
          errors={fieldErrors}
          errorMessage={formErrorMessage}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          existingLogoUrl={selectedCompanyLogoUrl}
          onChange={setDraftValue}
          onSubmit={handleSave}
          onCancel={requestCloseDrawer}
        />
      </Drawer>
    </StyledCompanies>
  );
};

export default Companies;
