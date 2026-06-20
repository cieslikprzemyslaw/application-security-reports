import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CompanyForm from '~/app/components/appsec/companyForm';
import type { CompanyFormValue } from '~/app/components/appsec/companyForm';
import { PageHeader } from '~/app/components/common';
import PageContent from '~/app/layouts/pageContent';
import type { CompanyListItem } from '~/domain';
import { ApiError } from '~/services/apiClient';
import { companyService } from '~/services';
import { routes } from '~/routes';

import type { CompanyIdentity } from './companies.type';
import {
  areCompanyFormValuesEqual,
  createEmptyCompanyFormValue,
  formValueToCompanyInput,
} from './companies.utils';

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
        'footerText',
      ].includes(path) &&
      !fieldErrors[path]
    ) {
      fieldErrors[path] = detail.message;
      continue;
    }

    generalErrors.push(detail.message);
  }

  return { fieldErrors, generalErrors };
};

export interface CreateCompanyProps {
  companies: CompanyListItem[];
  onCompaniesChange: (companies: CompanyListItem[]) => void;
  onActiveCompanyChange: (company: CompanyIdentity) => void;
}

const CreateCompany = ({
  companies,
  onCompaniesChange,
  onActiveCompanyChange,
}: CreateCompanyProps) => {
  const navigate = useNavigate();
  const [draftValue, setDraftValue] = useState<CompanyFormValue>(
    createEmptyCompanyFormValue,
  );
  const [baselineValue] = useState<CompanyFormValue>(
    createEmptyCompanyFormValue,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CompanyFormValue, string>>
  >({});
  const [formErrorMessage, setFormErrorMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = !areCompanyFormValuesEqual(draftValue, baselineValue);

  useEffect(() => {
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
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard unsaved company changes?')) {
      return;
    }

    navigate(routes.companies);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = formValueToCompanyInput(draftValue);
    const isFirstCompany = companies.length === 0;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrorMessage(undefined);

    try {
      const created = await companyService.create(payload);
      const nextCompanies: CompanyListItem[] = [
        { ...created, assessmentCount: 0 },
        ...companies,
      ];

      onCompaniesChange(nextCompanies);

      if (isFirstCompany) {
        onActiveCompanyChange({ id: created.id, name: created.name });
      } else {
        navigate(routes.companies);
      }
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

  return (
    <PageContent maxWidth="default">
      <PageHeader
        eyebrow="Workspace"
        title="Create company"
        subtitle="Create a company to unlock assessments and report branding."
      />

      <CompanyForm
        value={draftValue}
        errors={fieldErrors}
        errorMessage={formErrorMessage}
        isSubmitting={isSubmitting}
        submitLabel="Create company"
        onChange={setDraftValue}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </PageContent>
  );
};

export default CreateCompany;
