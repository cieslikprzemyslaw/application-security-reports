import React, { useEffect, useMemo, useRef, useState } from 'react';

import { CWE_CATALOG_CURRENT_VERSION } from '~/domain';

import CweSelector from '~/app/components/appsec/cweSelector';
import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';

import StyledThreatForm from './threatForm.styled';
import ThreatFormSection from './threatFormSection.component';
import {
  buildOwaspCategoryOptions,
  fieldIdMap,
  statusLabelMap,
} from './threatForm.utils';

import type { ThreatFormProps, ThreatFormValue } from './threatForm.type';

const securityFields: Array<keyof ThreatFormValue> = [
  'affectedComponent',
  'observation',
  'risk',
  'recommendation',
  'resolutionNote',
  'acceptedRiskJustification',
];
const additionalFields: Array<keyof ThreatFormValue> = ['references'];

const updateField = <K extends keyof ThreatFormValue>(
  value: ThreatFormValue,
  field: K,
  fieldValue: ThreatFormValue[K],
): ThreatFormValue => ({
  ...value,
  [field]: fieldValue,
});

const hasAnyValue = (
  value: ThreatFormValue,
  fields: Array<keyof ThreatFormValue>,
) => fields.some(field => String(value[field] ?? '').trim().length > 0);

const ThreatForm = ({
  value,
  owaspTaxonomyVersion,
  cweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
  errors = {},
  isSubmitting = false,
  focusField,
  submitLabel = 'Save finding',
  onChange,
  onSubmit,
}: ThreatFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSecurityOpen, setIsSecurityOpen] = useState(() =>
    hasAnyValue(value, securityFields),
  );
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(() =>
    hasAnyValue(value, additionalFields),
  );
  const owaspCategoryCode = value.owaspCategoryCode ?? '';
  const showCustomCategory = owaspCategoryCode === 'custom';
  const requiresOpenReadiness = value.status !== 'draft';
  const requiresResolutionNote = value.status === 'resolved';
  const requiresAcceptedRiskJustification = value.status === 'accepted-risk';
  const owaspCategoryOptions = buildOwaspCategoryOptions(
    owaspTaxonomyVersion,
    owaspCategoryCode,
  );
  const hasSecurityError = securityFields.some(field =>
    Boolean(errors[field]),
  );
  const hasAdditionalError = additionalFields.some(field =>
    Boolean(errors[field]),
  );
  const securityMustOpen =
    hasSecurityError ||
    Boolean(focusField && securityFields.includes(focusField));
  const additionalMustOpen =
    hasAdditionalError ||
    Boolean(focusField && additionalFields.includes(focusField));
  const resolvedSecurityOpen = isSecurityOpen || securityMustOpen;
  const resolvedAdditionalOpen = isAdditionalOpen || additionalMustOpen;

  const firstErrorFieldId = useMemo(() => {
    const orderedFields: Array<keyof ThreatFormValue> = [
      'title',
      'owaspCategoryCode',
      'customCategory',
      'cweIds',
      'severity',
      'status',
      'affectedEndpoint',
      ...securityFields,
      ...additionalFields,
    ];
    const errorField = orderedFields.find(field => Boolean(errors[field]));

    return errorField ? fieldIdMap[errorField] : undefined;
  }, [errors]);

  const requestedFocusFieldId = focusField ? fieldIdMap[focusField] : undefined;
  const focusTargetFieldId = firstErrorFieldId ?? requestedFocusFieldId;

  useEffect(() => {
    if (!focusTargetFieldId) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(focusTargetFieldId)}`,
      );

      field?.scrollIntoView({ block: 'center' });
      field?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [focusTargetFieldId, resolvedAdditionalOpen, resolvedSecurityOpen]);

  return (
    <StyledThreatForm ref={formRef} onSubmit={onSubmit} noValidate>
      <fieldset className="threat-form-core">
        <legend>Core details</legend>
        <p className="threat-form-section-description">
          Identify and classify the threat before adding deeper security detail.
        </p>

        <div className="threat-form-grid">
          <div className="threat-form-full-width">
            <Input
              id="threat-title"
              label="Title"
              value={value.title}
              error={errors.title}
              required
              onChange={event =>
                onChange(updateField(value, 'title', event.target.value))
              }
            />
          </div>

          <Select
            id="threat-owasp-category-code"
            label="OWASP category code"
            value={owaspCategoryCode}
            error={errors.owaspCategoryCode}
            required
            options={owaspCategoryOptions}
            onChange={event =>
              onChange({
                ...value,
                owaspCategoryCode: event.target
                  .value as ThreatFormValue['owaspCategoryCode'],
                customCategory:
                  event.target.value === 'custom' ? value.customCategory : '',
              })
            }
          />

          <Select
            id="threat-severity"
            label="Severity"
            value={value.severity}
            error={errors.severity}
            required
            options={(
              ['critical', 'high', 'medium', 'low', 'informational'] as const
            ).map(severity => ({
              label:
                severity === 'informational'
                  ? 'Informational'
                  : severity.charAt(0).toUpperCase() + severity.slice(1),
              value: severity,
            }))}
            onChange={event =>
              onChange(
                updateField(
                  value,
                  'severity',
                  event.target.value as ThreatFormValue['severity'],
                ),
              )
            }
          />

          {showCustomCategory && (
            <div className="threat-form-full-width">
              <Input
                id="threat-custom-category"
                label="Custom category"
                value={value.customCategory ?? ''}
                error={errors.customCategory}
                placeholder="Business logic flaw"
                required
                onChange={event =>
                  onChange(
                    updateField(value, 'customCategory', event.target.value),
                  )
                }
              />
            </div>
          )}

          <div className="threat-form-full-width">
            <CweSelector
              value={value.cweIds ?? []}
              catalogVersion={cweCatalogVersion}
              error={errors.cweIds}
              disabled={isSubmitting}
              onChange={cweIds =>
                onChange(updateField(value, 'cweIds', cweIds))
              }
            />
          </div>

          <Select
            id="threat-status"
            label="Status"
            value={value.status}
            error={errors.status}
            required
            options={Object.entries(statusLabelMap).map(([status, label]) => ({
              label,
              value: status,
            }))}
            onChange={event =>
              onChange(
                updateField(
                  value,
                  'status',
                  event.target.value as ThreatFormValue['status'],
                ),
              )
            }
          />

          <Input
            id="threat-affected-endpoint"
            label="Affected endpoint"
            value={value.affectedEndpoint}
            error={errors.affectedEndpoint}
            placeholder="/api/v1/orders/{id}"
            onChange={event =>
              onChange(
                updateField(value, 'affectedEndpoint', event.target.value),
              )
            }
          />
        </div>
      </fieldset>

      <ThreatFormSection
        title="Security details"
        description="Capture the affected component, reproduction, impact and remediation."
        isOpen={resolvedSecurityOpen}
        hasError={hasSecurityError}
        onToggle={() => {
          if (!securityMustOpen) {
            setIsSecurityOpen(current => !current);
          }
        }}
      >
        <div className="threat-form-grid">
          <Input
            id="threat-affected-component"
            label="Affected component"
            value={value.affectedComponent}
            error={errors.affectedComponent}
            required={requiresOpenReadiness}
            onChange={event =>
              onChange(
                updateField(value, 'affectedComponent', event.target.value),
              )
            }
          />

          <div className="threat-form-full-width">
            <Textarea
              id="threat-observation"
              label="Reproduction steps"
              value={value.observation}
              error={errors.observation}
              required={requiresOpenReadiness}
              onChange={event =>
                onChange(updateField(value, 'observation', event.target.value))
              }
            />
          </div>

          <div className="threat-form-full-width">
            <Textarea
              id="threat-risk"
              label="Impact"
              value={value.risk}
              error={errors.risk}
              required={requiresOpenReadiness}
              onChange={event =>
                onChange(updateField(value, 'risk', event.target.value))
              }
            />
          </div>

          <div className="threat-form-full-width">
            <Textarea
              id="threat-remediation"
              label="Remediation"
              value={value.recommendation}
              error={errors.recommendation}
              required={requiresOpenReadiness}
              onChange={event =>
                onChange(
                  updateField(value, 'recommendation', event.target.value),
                )
              }
            />
          </div>

          {requiresResolutionNote && (
            <div className="threat-form-full-width">
              <Textarea
                id="threat-resolution-note"
                label="Resolution note"
                value={value.resolutionNote ?? ''}
                error={errors.resolutionNote}
                required
                onChange={event =>
                  onChange(
                    updateField(value, 'resolutionNote', event.target.value),
                  )
                }
              />
            </div>
          )}

          {requiresAcceptedRiskJustification && (
            <div className="threat-form-full-width">
              <Textarea
                id="threat-accepted-risk-justification"
                label="Accepted-risk justification"
                value={value.acceptedRiskJustification ?? ''}
                error={errors.acceptedRiskJustification}
                required
                onChange={event =>
                  onChange(
                    updateField(
                      value,
                      'acceptedRiskJustification',
                      event.target.value,
                    ),
                  )
                }
              />
            </div>
          )}
        </div>
      </ThreatFormSection>

      <ThreatFormSection
        title="Additional information"
        description="Add external references and supporting standards when useful."
        isOpen={resolvedAdditionalOpen}
        hasError={hasAdditionalError}
        onToggle={() => {
          if (!additionalMustOpen) {
            setIsAdditionalOpen(current => !current);
          }
        }}
      >
        <Input
          id="threat-references"
          label="References"
          value={value.references}
          error={errors.references}
          required={requiresOpenReadiness}
          placeholder="OWASP API1:2023, CWE-639"
          onChange={event =>
            onChange(updateField(value, 'references', event.target.value))
          }
        />
      </ThreatFormSection>

      <p className="threat-form-readiness-note">
        Draft threats can be saved with partial details. Open, resolved, and
        accepted-risk threats require the core fields and any status-specific
        notes.
      </p>

      <div className="threat-form-actions">
        <Button
          type="submit"
          title={isSubmitting ? 'Saving' : submitLabel}
          isLoading={isSubmitting}
        />
      </div>
    </StyledThreatForm>
  );
};

export default ThreatForm;
