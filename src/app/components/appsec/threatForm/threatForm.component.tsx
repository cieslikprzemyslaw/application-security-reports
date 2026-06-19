import React, { useEffect, useMemo, useRef } from 'react';

import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';
import { OWASP_TOP_10_OPTIONS } from '~/domain';

import StyledThreatForm from './threatForm.styled';

import type { ThreatFormProps, ThreatFormValue } from './threatForm.type';

const owaspCategoryOptions = [
  ...OWASP_TOP_10_OPTIONS,
  { label: 'Custom', value: 'custom' },
];

const statusLabelMap: Record<ThreatFormValue['status'], string> = {
  draft: 'Draft',
  open: 'Open',
  resolved: 'Resolved',
  'accepted-risk': 'Accepted Risk',
  'in-review': 'In Review',
  mitigated: 'Mitigated',
  'false-positive': 'False Positive',
};

const updateField = <K extends keyof ThreatFormValue>(
  value: ThreatFormValue,
  field: K,
  fieldValue: ThreatFormValue[K],
): ThreatFormValue => ({
  ...value,
  [field]: fieldValue,
});

const fieldIdMap: Record<keyof ThreatFormValue, string> = {
  title: 'threat-title',
  owaspCategoryCode: 'threat-owasp-category-code',
  customCategory: 'threat-custom-category',
  strideCategory: 'threat-stride-category',
  severity: 'threat-severity',
  status: 'threat-status',
  affectedComponent: 'threat-affected-component',
  affectedEndpoint: 'threat-affected-endpoint',
  observation: 'threat-observation',
  reproductionSteps: 'threat-reproduction-steps',
  risk: 'threat-risk',
  recommendation: 'threat-remediation',
  references: 'threat-references',
  resolutionNote: 'threat-resolution-note',
  acceptedRiskJustification: 'threat-accepted-risk-justification',
};

const ThreatForm = ({
  value,
  errors = {},
  isSubmitting = false,
  submitLabel = 'Save finding',
  onChange,
  onSubmit,
}: ThreatFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const owaspCategoryCode = value.owaspCategoryCode ?? '';
  const showCustomCategory = owaspCategoryCode === 'custom';
  const requiresOpenReadiness = value.status !== 'draft';
  const requiresResolutionNote = value.status === 'resolved';
  const requiresAcceptedRiskJustification = value.status === 'accepted-risk';

  const firstErrorFieldId = useMemo(() => {
    const orderedFields: Array<keyof ThreatFormValue> = [
      'title',
      'owaspCategoryCode',
      'customCategory',
      'severity',
      'status',
      'affectedComponent',
      'affectedEndpoint',
      'observation',
      'risk',
      'recommendation',
      'references',
      'resolutionNote',
      'acceptedRiskJustification',
    ];

    const errorField = orderedFields.find(field => Boolean(errors[field]));

    return errorField ? fieldIdMap[errorField] : undefined;
  }, [errors]);

  useEffect(() => {
    if (!firstErrorFieldId) {
      return;
    }

    const field = formRef.current?.querySelector<HTMLElement>(
      `#${firstErrorFieldId}`,
    );

    field?.scrollIntoView({ block: 'center' });
    field?.focus();
  }, [firstErrorFieldId]);

  return (
    <StyledThreatForm ref={formRef} onSubmit={onSubmit} noValidate>
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

        <Select
          id="threat-severity"
          label="Severity"
          value={value.severity}
          error={errors.severity}
          required
          options={(
            ['critical', 'high', 'medium', 'low', 'informational'] as const
          ).map(value => ({
            label:
              value === 'informational'
                ? 'Informational'
                : value.charAt(0).toUpperCase() + value.slice(1),
            value,
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
              onChange(updateField(value, 'recommendation', event.target.value))
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

        <div className="threat-form-full-width">
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
        </div>
      </div>

      <p className="threat-form-readiness-note">
        Draft findings can be saved with partial details. Open, resolved, and
        accepted-risk findings require the core finding fields and any
        status-specific notes.
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
