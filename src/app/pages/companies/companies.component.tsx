import React, { useEffect, useState } from 'react';

import {
  FilterToolbar,
  PageHeader,
  PaginationSummary,
  TableFooter,
} from '~/app/components/common';
import CompanyForm from '~/app/components/appsec/companyForm';
import type { CompanyFormValue } from '~/app/components/appsec/companyForm';
import CompanyTable from '~/app/components/appsec/companyTable';
import Callout from '~/app/components/ui/callout';
import Drawer from '~/app/components/ui/drawer';
import Button from '~/app/components/ui/button';
import EmptyState from '~/app/components/ui/emptyState';
import Pagination from '~/app/components/ui/pagination';
import SearchInput from '~/app/components/ui/searchInput';
import { ApiError } from '~/services/apiClient';
import { companyService } from '~/services';

import StyledCompanies from './companies.styled';

import type { CompaniesProps, CompanyIdentity } from './companies.type';
import {
  areCompanyFormValuesEqual,
  companyToFormValue,
  companyToTableRow,
  createEmptyCompanyFormValue,
  formValueToCompanyInput,
} from './companies.utils';

const PAGE_SIZE = 8;

const createCompanyValidationErrorMap = (details: ApiError['details']) => {
  const fieldErrors: Partial<Record<keyof CompanyFormValue, string>> = {};
  const generalErrors: string[] = [];

  for (const detail of details) {
    const path = detail.path.split('.')[0] as
      | keyof CompanyFormValue
      | undefined;

    if (
      path &&
      [
        'name',
        'description',
        'website',
        'contactName',
        'contactEmail',
        'logoPath',
        'footerText',
      ].includes(path) &&
      !fieldErrors[path]
    ) {
      fieldErrors[path] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return {
    fieldErrors,
    generalErrors,
  };
};

const companiesMatchSearch = (company: string | undefined, query: string) =>
  Boolean(company?.toLowerCase().includes(query));

const Companies = ({
  activeCompany,
  onActiveCompanyChange,
}: CompaniesProps) => {
  const [companies, setCompanies] = useState<
    Awaited<ReturnType<typeof companyService.list>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | undefined
  >();
  const [draftValue, setDraftValue] = useState(createEmptyCompanyFormValue());
  const [baselineValue, setBaselineValue] = useState(draftValue);
  const [fieldErrors, setFieldErrors] = useState<Partial<CompanyFormValue>>({});
  const [formErrorMessage, setFormErrorMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const activeCompanyId = activeCompany?.id;

  useEffect(() => {
    const isDirty =
      drawerMode !== null &&
      !areCompanyFormValuesEqual(draftValue, baselineValue);

    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [baselineValue, draftValue, drawerMode]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCompanies = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextCompanies = await companyService.list(controller.signal);

        if (!isActive) {
          return;
        }

        setCompanies(nextCompanies);

        if (
          nextCompanies.length === 1 &&
          nextCompanies[0] &&
          nextCompanies[0].id !== activeCompanyId
        ) {
          onActiveCompanyChange?.({
            id: nextCompanies[0].id,
            name: nextCompanies[0].name,
          });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : 'Unable to load companies.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [reloadKey]);

  const resetDrawerState = () => {
    setDrawerMode(null);
    setSelectedCompanyId(undefined);
    setDraftValue(createEmptyCompanyFormValue());
    setBaselineValue(createEmptyCompanyFormValue());
    setFieldErrors({});
    setFormErrorMessage(undefined);
    setIsSubmitting(false);
  };

  const hasUnsavedChanges =
    drawerMode !== null &&
    !areCompanyFormValuesEqual(draftValue, baselineValue);

  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm('Discard unsaved company changes?');
  };

  const openCreateDrawer = () => {
    if (!confirmDiscardChanges()) {
      return;
    }

    setDrawerMode('create');
    const value = createEmptyCompanyFormValue();
    setSelectedCompanyId(undefined);
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormErrorMessage(undefined);
  };

  const openEditDrawer = (companyId: string) => {
    if (!confirmDiscardChanges()) {
      return;
    }

    const company = companies.find(item => item.id === companyId);

    if (!company) {
      return;
    }

    setDrawerMode('edit');
    setSelectedCompanyId(company.id);
    const value = companyToFormValue(company);
    setDraftValue(value);
    setBaselineValue(value);
    setFieldErrors({});
    setFormErrorMessage(undefined);
  };

  const requestCloseDrawer = () => {
    if (isSubmitting) {
      return;
    }

    if (!confirmDiscardChanges()) {
      return;
    }

    resetDrawerState();
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = formValueToCompanyInput(draftValue);
    const isFirstCompany = companies.length === 0;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrorMessage(undefined);

    try {
      if (drawerMode === 'edit' && selectedCompanyId) {
        const updated = await companyService.update(selectedCompanyId, payload);

        if (activeCompanyId === updated.id) {
          onActiveCompanyChange?.({ id: updated.id, name: updated.name });
        }
      } else {
        const created = await companyService.create(payload);

        if (isFirstCompany) {
          onActiveCompanyChange?.({ id: created.id, name: created.name });
        }
      }

      setReloadKey(key => key + 1);
      resetDrawerState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const { fieldErrors: nextFieldErrors, generalErrors } =
          createCompanyValidationErrorMap(error.details);

        setFieldErrors(nextFieldErrors);
        setFormErrorMessage(
          generalErrors.length > 0
            ? generalErrors.join(' ')
            : 'Please fix the highlighted fields and try again.',
        );
      } else {
        setFormErrorMessage(
          error instanceof Error ? error.message : 'Unable to save company.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const query = searchValue.toLowerCase().trim();
  const filteredCompanies = companies.filter(company => {
    if (query.length === 0) {
      return true;
    }

    return (
      companiesMatchSearch(company.name, query) ||
      companiesMatchSearch(company.website, query) ||
      companiesMatchSearch(company.contactName, query) ||
      companiesMatchSearch(company.contactEmail, query) ||
      companiesMatchSearch(company.description, query)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedCompanies = filteredCompanies.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const showEmptyWorkspace = !isLoading && !loadError && companies.length === 0;
  const showNoResults =
    !isLoading &&
    !loadError &&
    !showEmptyWorkspace &&
    filteredCompanies.length === 0;

  const emptyState = showEmptyWorkspace ? (
    <EmptyState
      title="No companies yet"
      description="Add a company to start building assessments and reports."
      primaryAction={<Button title="New company" onClick={openCreateDrawer} />}
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
          onClick={() => {
            setSearchValue('');
            setCurrentPage(1);
          }}
        />
      }
    />
  ) : undefined;

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCompanyClick = (company: CompanyIdentity) => {
    openEditDrawer(company.id);
  };

  const pageSummary = (
    <PaginationSummary
      currentPage={safePage}
      pageSize={PAGE_SIZE}
      totalItems={filteredCompanies.length}
      itemLabel="companies"
    />
  );

  return (
    <StyledCompanies>
      <PageHeader
        eyebrow="Workspace"
        title="Companies"
        subtitle="Manage client organisations and the assessments associated with them."
        actions={<Button title="New company" onClick={openCreateDrawer} />}
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
                  onClick={() => setReloadKey(key => key + 1)}
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
              onCompanyClick={company => handleCompanyClick(company)}
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
        title={drawerMode === 'edit' ? 'Edit company' : 'Create company'}
        description={
          drawerMode === 'edit'
            ? 'Update the company details used throughout the workspace.'
            : 'Create a company to unlock assessments and report branding.'
        }
        onClose={requestCloseDrawer}
        size="large"
      >
        <CompanyForm
          value={draftValue}
          errors={fieldErrors}
          errorMessage={formErrorMessage}
          isSubmitting={isSubmitting}
          submitLabel={
            drawerMode === 'edit' ? 'Save changes' : 'Create company'
          }
          onChange={setDraftValue}
          onSubmit={handleSave}
          onCancel={requestCloseDrawer}
        />
      </Drawer>
    </StyledCompanies>
  );
};

export default Companies;
