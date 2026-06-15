import { useEffect, useState } from 'react';

import type { CompanyListItem } from '~/domain';
import { ApiError } from '~/services/apiClient';
import { companyService } from '~/services';

import type { CompanyFormValue } from '~/app/components/appsec/companyForm';
import {
  areCompanyFormValuesEqual,
  companyToFormValue,
  createEmptyCompanyFormValue,
  formValueToCompanyInput,
} from './companies.utils';
import type { CompaniesProps, CompanyIdentity } from './companies.type';

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

export const useCompaniesController = ({
  activeCompany,
  onCompaniesChange,
  onActiveCompanyChange,
  openCreateDrawer: shouldOpenCreateDrawer = false,
}: CompaniesProps) => {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(
    shouldOpenCreateDrawer ? 'create' : null,
  );
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
        onCompaniesChange?.(nextCompanies);
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
  }, [reloadKey, onCompaniesChange]);

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
        const nextCompanies = companies.map(company =>
          company.id === updated.id
            ? {
                ...company,
                ...updated,
              }
            : company,
        );

        setCompanies(nextCompanies);
        onCompaniesChange?.(nextCompanies);

        if (activeCompanyId === updated.id) {
          onActiveCompanyChange?.({ id: updated.id, name: updated.name });
        }
      } else {
        const created = await companyService.create(payload);
        const nextCompanies: CompanyListItem[] = [
          {
            ...created,
            assessmentCount: 0,
          },
          ...companies,
        ];

        setCompanies(nextCompanies);
        onCompaniesChange?.(nextCompanies);

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

  const reloadCompanies = () => {
    setReloadKey(key => key + 1);
  };

  return {
    companies,
    filteredCompanies,
    pagedCompanies,
    totalPages,
    safePage,
    isLoading,
    loadError,
    searchValue,
    currentPage,
    drawerMode,
    draftValue,
    fieldErrors,
    formErrorMessage,
    isSubmitting,
    showEmptyWorkspace,
    showNoResults,
    setDraftValue,
    openCreateDrawer,
    reloadCompanies,
    requestCloseDrawer,
    handleSave,
    handleSearchChange,
    handlePageChange,
    handleCompanyClick,
  };
};
