import React, { useEffect, useState } from 'react';
import {
  unstable_usePrompt,
  useBeforeUnload,
  useNavigate,
} from 'react-router-dom';

import CompanyForm from '~/app/components/appsec/companyForm';
import type { CompanyFormValue } from '~/app/components/appsec/companyForm';
import Button from '~/app/components/ui/button';
import { PageHeader } from '~/app/components/common';
import PageContent from '~/app/layouts/pageContent';
import type { Company, CompanyListItem } from '~/domain';
import { ApiError } from '~/services/apiClient';
import { companyService } from '~/services';
import { routes } from '~/routes';

import type { CompanyIdentity } from './companies.type';
import {
  areCompanyFormValuesEqual,
  companyToFormValue,
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

interface CreatedCompanyState {
  company: Company;
  isFirstCompany: boolean;
}

const upsertCompany = (
  companies: CompanyListItem[],
  company: Company,
): CompanyListItem[] => {
  const existingCompany = companies.find(item => item.id === company.id);
  const nextCompany: CompanyListItem = {
    ...existingCompany,
    ...company,
    assessmentCount: existingCompany?.assessmentCount ?? 0,
  };

  return [
    nextCompany,
    ...companies.filter(existing => existing.id !== company.id),
  ];
};

const CreateCompany = ({
  companies,
  onCompaniesChange,
  onActiveCompanyChange,
}: CreateCompanyProps) => {
  const navigate = useNavigate();
  const [draftValue, setDraftValue] = useState<CompanyFormValue>(
    createEmptyCompanyFormValue,
  );
  const [baselineValue, setBaselineValue] = useState<CompanyFormValue>(
    createEmptyCompanyFormValue,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CompanyFormValue, string>>
  >({});
  const [formErrorMessage, setFormErrorMessage] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCompany, setCreatedCompany] = useState<
    CreatedCompanyState | undefined
  >();
  const [completedCompany, setCompletedCompany] = useState<
    CreatedCompanyState | undefined
  >();
  const [logoUploadErrorMessage, setLogoUploadErrorMessage] = useState<
    string | undefined
  >();

  const isDirty = !areCompanyFormValuesEqual(draftValue, baselineValue);

  useBeforeUnload(event => {
    if (!isDirty || isSubmitting) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });

  unstable_usePrompt({
    when: isDirty && !isSubmitting,
    message: 'Discard unsaved company changes?',
  });

  useEffect(() => {
    if (!completedCompany) {
      return;
    }

    if (completedCompany.isFirstCompany) {
      onActiveCompanyChange({
        id: completedCompany.company.id,
        name: completedCompany.company.name,
      });
    } else {
      navigate(routes.companies);
    }
  }, [completedCompany, navigate, onActiveCompanyChange]);

  const handleCompaniesUpdate = (company: Company) => {
    onCompaniesChange(upsertCompany(companies, company));
  };

  const completeCreateFlow = (company: Company, isFirstCompany: boolean) => {
    const resolvedValue = companyToFormValue(company);

    setDraftValue(resolvedValue);
    setBaselineValue(resolvedValue);
    setCreatedCompany(undefined);
    setFormErrorMessage(undefined);
    setLogoUploadErrorMessage(undefined);
    setCompletedCompany({ company, isFirstCompany });
  };

  const uploadPendingLogo = async (
    company: Company,
    isFirstCompany: boolean,
    file: File,
  ) => {
    const updated = await companyService.uploadLogo(company.id, file);

    handleCompaniesUpdate(updated);
    completeCreateFlow(updated, isFirstCompany);
  };

  const handleCancel = () => {
    navigate(routes.companies);
  };

  const handleDeferLogo = () => {
    if (!createdCompany) {
      return;
    }
    completeCreateFlow(createdCompany.company, createdCompany.isFirstCompany);
  };

  const handleDraftChange = (nextValue: CompanyFormValue) => {
    setDraftValue(nextValue);
    setFieldErrors({});
    setFormErrorMessage(undefined);

    if (createdCompany) {
      setLogoUploadErrorMessage(undefined);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setFieldErrors({});
    setFormErrorMessage(undefined);
    setLogoUploadErrorMessage(undefined);

    try {
      if (createdCompany) {
        if (!draftValue.logoFile) {
          handleDeferLogo();
          return;
        }

        await uploadPendingLogo(
          createdCompany.company,
          createdCompany.isFirstCompany,
          draftValue.logoFile,
        );

        return;
      }

      const payload = formValueToCompanyInput(draftValue);
      const isFirstCompany = companies.length === 0;
      const created = await companyService.create(payload);
      const selectedLogoFile = draftValue.logoFile;

      handleCompaniesUpdate(created);

      if (!selectedLogoFile) {
        completeCreateFlow(created, isFirstCompany);
        return;
      }

      setDraftValue({
        ...companyToFormValue(created),
        logoFile: selectedLogoFile,
      });
      setBaselineValue(companyToFormValue(created));
      setCreatedCompany({ company: created, isFirstCompany });

      try {
        await uploadPendingLogo(created, isFirstCompany, selectedLogoFile);
      } catch (logoError) {
        setLogoUploadErrorMessage(
          logoError instanceof Error
            ? logoError.message
            : 'Unable to upload logo.',
        );
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
        notice={
          createdCompany
            ? {
                title: 'Company created. Logo upload still pending.',
                variant: 'warning',
                actions: (
                  <>
                    <Button
                      type="submit"
                      title="Retry logo upload"
                      size="small"
                      disabled={isSubmitting || draftValue.logoFile === null}
                    />
                    <Button
                      type="button"
                      title="Continue without logo"
                      variant="secondary"
                      size="small"
                      disabled={isSubmitting}
                      onClick={handleDeferLogo}
                    />
                  </>
                ),
                children: (
                  <p>
                    {logoUploadErrorMessage
                      ? `The company was created, but the logo upload failed: ${logoUploadErrorMessage} Retry the upload or continue without a logo.`
                      : 'The company was created, but the logo upload did not complete. Retry the upload or continue without a logo.'}
                  </p>
                ),
              }
            : undefined
        }
        errorMessage={formErrorMessage}
        isSubmitting={isSubmitting}
        isLogoOnlyMode={createdCompany !== undefined}
        submitLabel={
          createdCompany
            ? draftValue.logoFile
              ? 'Retry logo upload'
              : 'Continue without logo'
            : 'Create company'
        }
        onChange={handleDraftChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </PageContent>
  );
};

export default CreateCompany;
