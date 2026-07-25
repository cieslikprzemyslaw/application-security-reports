import React, { useEffect, useState } from 'react';

import CompanyForm from '~/app/components/appsec/companyForm';
import { DirtyFormGuard } from '~/app/components/common';
import { RouteLoadingView } from '~/app/components/routeStateViews';
import { useDirtyFormGuard } from '~/app/hooks/useDirtyFormGuard';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Drawer from '~/app/components/ui/drawer';
import {
  areCompanyFormValuesEqual,
  companyToFormValue,
  createEmptyCompanyFormValue,
  formValueToCompanyInput,
} from '~/app/pages/companies/companies.utils';
import type { CompanyFormValue } from '~/app/components/appsec/companyForm';
import { companyService } from '~/services';
import { ApiError } from '~/services/apiClient';

import CompanyOverviewDashboardView from './companyOverviewDashboard.view';
import StyledDashboard from './companyOverviewDashboard.styled';
import type { CompanyOverviewDashboardProps } from './companyOverviewDashboard.type';
import type { CompanyOverviewResponse } from '~/services/companyService';

const companyFormFieldNames: (keyof CompanyFormValue)[] = [
  'name',
  'description',
  'website',
  'contactName',
  'contactEmail',
  'footerText',
];

const createCompanyValidationErrorMap = (details: ApiError['details']) => {
  const fieldErrors: Partial<Record<keyof CompanyFormValue, string>> = {};
  const generalErrors: string[] = [];

  for (const detail of details) {
    const path = detail.path.split('.')[0] as
      | keyof CompanyFormValue
      | undefined;

    if (path && companyFormFieldNames.includes(path) && !fieldErrors[path]) {
      fieldErrors[path] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return { fieldErrors, generalErrors };
};

const CompanyOverviewDashboard = ({
  companyId,
}: CompanyOverviewDashboardProps) => {
  const [overview, setOverview] = useState<CompanyOverviewResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(createEmptyCompanyFormValue());
  const [baselineValue, setBaselineValue] = useState(draftValue);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CompanyFormValue, string>>
  >({});
  const [formErrorMessage, setFormErrorMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setLoadError(undefined);

      try {
        const nextOverview = await companyService.getOverview(
          companyId,
          controller.signal,
        );

        if (isActive) {
          setOverview(nextOverview);
        }
      } catch (error) {
        if (
          !isActive ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load company overview.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [companyId, reloadKey]);

  const resetDrawerState = () => {
    setIsEditDrawerOpen(false);
    setDraftValue(createEmptyCompanyFormValue());
    setBaselineValue(createEmptyCompanyFormValue());
    setFieldErrors({});
    setFormErrorMessage(undefined);
    setIsSubmitting(false);
  };

  const hasUnsavedChanges =
    isEditDrawerOpen && !areCompanyFormValuesEqual(draftValue, baselineValue);

  const dirtyFormGuard = useDirtyFormGuard(hasUnsavedChanges && !isSubmitting);

  const openEditDrawer = () => {
    if (!overview) {
      return;
    }

    dirtyFormGuard.requestDiscard(() => {
      const value = companyToFormValue(overview.company);
      setDraftValue(value);
      setBaselineValue(value);
      setFieldErrors({});
      setFormErrorMessage(undefined);
      setIsEditDrawerOpen(true);
    });
  };

  const requestCloseDrawer = () => {
    if (isSubmitting) {
      return;
    }

    dirtyFormGuard.requestDiscard(resetDrawerState);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!overview) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrorMessage(undefined);

    try {
      let updatedCompany = await companyService.update(
        overview.company.id,
        formValueToCompanyInput(draftValue),
      );

      if (draftValue.logoFile !== null) {
        try {
          updatedCompany = await companyService.uploadLogo(
            overview.company.id,
            draftValue.logoFile,
          );
        } catch (logoError) {
          setFormErrorMessage(
            logoError instanceof Error
              ? logoError.message
              : 'Unable to upload logo.',
          );
          return;
        }
      } else if (baselineValue.hasExistingLogo && !draftValue.hasExistingLogo) {
        try {
          await companyService.removeLogo(overview.company.id);
          updatedCompany = {
            ...updatedCompany,
            logoUrl: null,
          };
        } catch (logoError) {
          setFormErrorMessage(
            logoError instanceof Error
              ? logoError.message
              : 'Unable to remove logo.',
          );
          return;
        }
      }

      setOverview(current =>
        current ? { ...current, company: updatedCompany } : current,
      );
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

  if (isLoading && !overview) {
    return <RouteLoadingView />;
  }

  if (loadError && !overview) {
    return (
      <StyledDashboard>
        <Callout
          variant="error"
          title="Unable to load company overview"
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
      </StyledDashboard>
    );
  }

  if (!overview) {
    return <RouteLoadingView />;
  }

  return (
    <StyledDashboard>
      {isLoading && (
        <div role="status" aria-live="polite">
          Refreshing company overview...
        </div>
      )}

      {loadError && (
        <Callout
          variant="warning"
          title="Company overview may be out of date"
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
      )}

      <CompanyOverviewDashboardView
        companyId={companyId}
        overview={overview}
        onEditCompany={openEditDrawer}
      />

      <Drawer
        isOpen={isEditDrawerOpen}
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
          existingLogoUrl={overview.company.logoUrl}
          onChange={setDraftValue}
          onSubmit={handleEditSubmit}
          onCancel={requestCloseDrawer}
        />
      </Drawer>
      <DirtyFormGuard
        isBlocked={dirtyFormGuard.isBlocked}
        onCancel={dirtyFormGuard.cancel}
        onProceed={dirtyFormGuard.proceed}
      />
    </StyledDashboard>
  );
};

export default CompanyOverviewDashboard;
