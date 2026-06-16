import React from 'react';

import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';

import StyledThreatForm from './threatForm.styled';

import type { ThreatFormProps, ThreatFormValue } from './threatForm.type';

const owaspCategoryOptions = [
  { label: 'A01:2021 - Broken Access Control', value: 'A01:2021' },
  { label: 'A02:2021 - Cryptographic Failures', value: 'A02:2021' },
  { label: 'A03:2021 - Injection', value: 'A03:2021' },
  { label: 'A04:2021 - Insecure Design', value: 'A04:2021' },
  { label: 'A05:2021 - Security Misconfiguration', value: 'A05:2021' },
  {
    label: 'A06:2021 - Vulnerable and Outdated Components',
    value: 'A06:2021',
  },
  {
    label: 'A07:2021 - Identification and Authentication Failures',
    value: 'A07:2021',
  },
  {
    label: 'A08:2021 - Software and Data Integrity Failures',
    value: 'A08:2021',
  },
  {
    label: 'A09:2021 - Security Logging and Monitoring Failures',
    value: 'A09:2021',
  },
  {
    label: 'A10:2021 - Server-Side Request Forgery',
    value: 'A10:2021',
  },
  { label: 'Custom', value: 'custom' },
] as const;

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

const ThreatForm = ({
  value,
  errors = {},
  isSubmitting = false,
  submitLabel = 'Save finding',
  onChange,
  onSubmit,
}: ThreatFormProps) => {
  const owaspCategoryCode = value.owaspCategoryCode ?? '';
  const showCustomCategory = owaspCategoryCode === 'custom';
  const requiresOpenReadiness = value.status !== 'draft';
  const requiresResolutionNote = value.status === 'resolved';
  const requiresAcceptedRiskJustification = value.status === 'accepted-risk';

  return (
    <StyledThreatForm onSubmit={onSubmit}>
      <div className="threat-form-grid">
        <div className="threat-form-full-width">
          <Input
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
          label="OWASP category code"
          value={owaspCategoryCode}
          error={errors.owaspCategoryCode}
          required
          options={owaspCategoryOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={event =>
            onChange(
              updateField(
                value,
                'owaspCategoryCode',
                event.target.value as ThreatFormValue['owaspCategoryCode'],
              ),
            )
          }
        />

        <div className="threat-form-full-width">
          <Input
            label="Custom category"
            value={value.customCategory ?? ''}
            error={errors.customCategory}
            placeholder="Business logic flaw"
            required={showCustomCategory}
            onChange={event =>
              onChange(updateField(value, 'customCategory', event.target.value))
            }
          />
        </div>

        <Select
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
