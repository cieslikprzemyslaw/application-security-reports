import React, { useEffect, useMemo, useRef, useState } from 'react';

import CompanyAvatar from '~/app/components/appsec/companyAvatar';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Dropzone from '~/app/components/ui/dropzone';
import Input from '~/app/components/ui/input';
import Textarea from '~/app/components/ui/textarea';

import StyledCompanyForm from './companyForm.styled';
import type { CompanyFormProps, CompanyFormValue } from './companyForm.type';

const LOGO_ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';
const LOGO_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

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
  notice,
  errorMessage,
  isSubmitting = false,
  isLogoOnlyMode = false,
  submitLabel = 'Save company',
  existingLogoUrl,
  onChange,
  onSubmit,
  onCancel,
}: CompanyFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [logoSelectionError, setLogoSelectionError] = useState<
    string | undefined
  >();
  const [failedLocalPreviewUrl, setFailedLocalPreviewUrl] = useState<
    string | undefined
  >();

  const previewUrl = useMemo(() => {
    if (!value.logoFile) {
      return null;
    }

    return URL.createObjectURL(value.logoFile);
  }, [value.logoFile]);

  const firstErrorFieldId = useMemo(() => {
    const errorField = Object.keys(errors).find(field =>
      Boolean(errors[field as keyof CompanyFormValue]),
    ) as keyof CompanyFormValue | undefined;

    return errorField ? `company-${errorField}` : undefined;
  }, [errors]);

  useEffect(() => {
    if (isLogoOnlyMode) {
      return;
    }

    const fieldId = firstErrorFieldId ?? 'company-name';
    const field = formRef.current?.querySelector<HTMLElement>(`#${fieldId}`);

    field?.focus();
  }, [firstErrorFieldId, isLogoOnlyMode]);

  useEffect(() => {
    if (!previewUrl) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleLogoFiles = (files: File[]) => {
    const file = files[0];

    if (!file) {
      return;
    }

    if (!LOGO_ALLOWED_MIME_TYPES.has(file.type)) {
      setLogoSelectionError(
        'The selected file type is not supported. Use JPEG, PNG, or WebP.',
      );
      return;
    }

    setLogoSelectionError(undefined);
    onChange(updateField(value, 'logoFile', file));

    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoSelectionError(undefined);
    setFailedLocalPreviewUrl(undefined);
    onChange({ ...value, logoFile: null, hasExistingLogo: false });
  };

  const errorSummary = Object.entries(errors).filter(([, error]) =>
    Boolean(error),
  );
  const showExistingLogoPreview = Boolean(
    !previewUrl && value.hasExistingLogo && existingLogoUrl,
  );
  const showLocalPreview = Boolean(
    previewUrl && failedLocalPreviewUrl !== previewUrl,
  );
  const showLogoPreview = Boolean(previewUrl || showExistingLogoPreview);

  return (
    <StyledCompanyForm ref={formRef} onSubmit={onSubmit} noValidate>
      {notice && (
        <Callout
          className="company-form-alert"
          variant={notice.variant ?? 'info'}
          title={notice.title}
          actions={notice.actions}
        >
          {notice.children}
        </Callout>
      )}

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
            disabled={isLogoOnlyMode || isSubmitting}
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
            disabled={isLogoOnlyMode || isSubmitting}
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
          disabled={isLogoOnlyMode || isSubmitting}
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
          disabled={isLogoOnlyMode || isSubmitting}
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
          disabled={isLogoOnlyMode || isSubmitting}
          onChange={event =>
            onChange(updateField(value, 'contactEmail', event.target.value))
          }
        />

        <div className="company-form-full-width">
          <Textarea
            id="company-footer-text"
            label="Report footer text"
            value={value.footerText}
            error={errors.footerText}
            disabled={isLogoOnlyMode || isSubmitting}
            description="Applied to report footers for this company."
            onChange={event =>
              onChange(updateField(value, 'footerText', event.target.value))
            }
          />
        </div>

        <div className="company-form-full-width">
          {showLogoPreview ? (
            <div className="company-logo-preview">
              <span className="company-logo-preview-label">Company logo</span>
              {showLocalPreview ? (
                <img
                  className="company-logo-preview-img"
                  src={previewUrl ?? undefined}
                  alt="Company logo preview"
                  onError={() =>
                    setFailedLocalPreviewUrl(previewUrl ?? undefined)
                  }
                />
              ) : showExistingLogoPreview ? (
                <CompanyAvatar
                  className="company-logo-preview-img"
                  companyName={value.name || 'Company'}
                  logoUrl={existingLogoUrl}
                  size="large"
                  ariaLabel="Company logo preview"
                />
              ) : (
                <CompanyAvatar
                  className="company-logo-preview-img"
                  companyName={value.name || 'Company'}
                  size="large"
                  ariaLabel="Company logo preview"
                />
              )}
              <div className="company-logo-preview-actions">
                <input
                  ref={replaceInputRef}
                  id="company-logo-replace"
                  type="file"
                  accept={LOGO_ACCEPTED_TYPES}
                  className="company-logo-replace-input"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={event =>
                    handleLogoFiles(Array.from(event.target.files ?? []))
                  }
                />
                <Button
                  type="button"
                  title="Replace logo"
                  variant="secondary"
                  size="small"
                  disabled={isSubmitting}
                  onClick={() => replaceInputRef.current?.click()}
                />
                <Button
                  type="button"
                  title="Remove logo"
                  variant="secondary"
                  size="small"
                  disabled={isSubmitting}
                  onClick={handleRemoveLogo}
                />
              </div>
            </div>
          ) : (
            <Dropzone
              id="company-logo"
              label="Company logo"
              description="Accepted: JPEG, PNG, WebP. SVG is not supported."
              acceptedTypes={LOGO_ACCEPTED_TYPES}
              error={logoSelectionError}
              multiple={false}
              disabled={isSubmitting}
              onFilesSelected={handleLogoFiles}
            />
          )}
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
