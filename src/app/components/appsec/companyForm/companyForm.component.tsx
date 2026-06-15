import React, { useEffect, useMemo, useRef } from 'react';

import Callout from '~/app/components/ui/callout';
import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Textarea from '~/app/components/ui/textarea';

import StyledCompanyForm from './companyForm.styled';
import type { CompanyFormProps, CompanyFormValue } from './companyForm.type';

const updateField = <K extends keyof CompanyFormValue>(
  value: CompanyFormValue,
  field: K,
  fieldValue: CompanyFormValue[K],
): CompanyFormValue => ({
  ...value,
  [field]: fieldValue,
});

const CompanyForm = ({
  value,
  errors = {},
  errorMessage,
  isSubmitting = false,
  submitLabel = 'Save company',
  onChange,
  onSubmit,
  onCancel,
}: CompanyFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const firstErrorFieldId = useMemo(() => {
    const errorField = Object.keys(errors).find(field =>
      Boolean(errors[field as keyof CompanyFormValue]),
    ) as keyof CompanyFormValue | undefined;

    return errorField ? `company-${errorField}` : undefined;
  }, [errors]);

  useEffect(() => {
    const fieldId = firstErrorFieldId ?? 'company-name';
    const field = formRef.current?.querySelector<HTMLElement>(`#${fieldId}`);

    field?.focus();
  }, [firstErrorFieldId]);

  const errorSummary = Object.entries(errors).filter(([, error]) =>
    Boolean(error),
  );

  return (
    <StyledCompanyForm ref={formRef} onSubmit={onSubmit} noValidate>
      {(errorMessage || errorSummary.length > 0) && (
        <Callout
          className="company-form-alert"
          variant="error"
          title="Could not save company"
        >
          {errorMessage && <p>{errorMessage}</p>}

          {errorSummary.length > 0 && (
            <ul>
              {errorSummary.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
        </Callout>
      )}

      <div className="company-form-grid">
        <div className="company-form-full-width">
          <Input
            id="company-name"
            label="Company name"
            value={value.name}
            error={errors.name}
            required
            onChange={event =>
              onChange(updateField(value, 'name', event.target.value))
            }
          />
        </div>

        <div className="company-form-full-width">
          <Textarea
            id="company-description"
            label="Description"
            value={value.description}
            error={errors.description}
            description="Used to help the team recognise the company in longer lists."
            onChange={event =>
              onChange(updateField(value, 'description', event.target.value))
            }
          />
        </div>

        <Input
          id="company-website"
          label="Website"
          value={value.website}
          error={errors.website}
          description="Use a full URL. A scheme will be added automatically if missing."
          onChange={event =>
            onChange(updateField(value, 'website', event.target.value))
          }
        />

        <Input
          id="company-contact-name"
          label="Primary contact name"
          value={value.contactName}
          error={errors.contactName}
          onChange={event =>
            onChange(updateField(value, 'contactName', event.target.value))
          }
        />

        <Input
          id="company-contact-email"
          label="Primary contact email"
          value={value.contactEmail}
          error={errors.contactEmail}
          type="email"
          onChange={event =>
            onChange(updateField(value, 'contactEmail', event.target.value))
          }
        />

        <Input
          id="company-logo-path"
          label="Client logo"
          value={value.logoPath}
          error={errors.logoPath}
          description="Store the backend logo path or public asset URL."
          onChange={event =>
            onChange(updateField(value, 'logoPath', event.target.value))
          }
        />

        <div className="company-form-full-width">
          <Textarea
            id="company-footer-text"
            label="Report footer text"
            value={value.footerText}
            error={errors.footerText}
            description="Applied to report footers for this company."
            onChange={event =>
              onChange(updateField(value, 'footerText', event.target.value))
            }
          />
        </div>
      </div>

      <p className="company-form-hint">
        Fields marked as optional can be left blank and will not be sent.
      </p>

      <div className="company-form-actions">
        <Button
          title="Cancel"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        />

        <Button type="submit" title={submitLabel} isLoading={isSubmitting} />
      </div>
    </StyledCompanyForm>
  );
};

export default CompanyForm;
