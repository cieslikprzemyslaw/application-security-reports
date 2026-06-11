import React from 'react';
import {
  STRIDE_CATEGORIES,
  STRIDE_LABELS,
  SEVERITIES,
  THREAT_STATUSES,
} from '~/domain';

import Button from '~/app/components/ui/button';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';

import StyledThreatForm from './threatForm.styled';

import type { ThreatFormProps, ThreatFormValue } from './threatForm.type';

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
  submitLabel = 'Save threat',
  onChange,
  onSubmit,
}: ThreatFormProps) => (
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
        label="STRIDE category"
        value={value.strideCategory}
        error={errors.strideCategory}
        required
        options={[
          ...STRIDE_CATEGORIES.map(value => ({
            label: STRIDE_LABELS[value],
            value,
          })),
        ]}
        onChange={event =>
          onChange(
            updateField(
              value,
              'strideCategory',
              event.target.value as ThreatFormValue['strideCategory'],
            ),
          )
        }
      />

      <Select
        label="Severity"
        value={value.severity}
        error={errors.severity}
        required
        options={[
          ...(['critical', 'high', 'medium', 'low', 'informational'] as const).map(
            value => ({
              label: value === 'informational'
                ? 'Informational'
                : value.charAt(0).toUpperCase() + value.slice(1),
              value,
            }),
          ),
        ]}
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
        options={[
          ...THREAT_STATUSES.map(value => ({
            label:
              {
                open: 'Open',
                'in-review': 'In Review',
                mitigated: 'Mitigated',
                'accepted-risk': 'Accepted Risk',
                'false-positive': 'False Positive',
              }[value],
            value,
          })),
        ]}
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
        onChange={event =>
          onChange(updateField(value, 'affectedComponent', event.target.value))
        }
      />

      <div className="threat-form-full-width">
        <Input
          label="Affected endpoint"
          value={value.affectedEndpoint}
          error={errors.affectedEndpoint}
          placeholder="/api/v1/orders/{id}"
          onChange={event =>
            onChange(updateField(value, 'affectedEndpoint', event.target.value))
          }
        />
      </div>

      <div className="threat-form-full-width">
        <Textarea
          label="Observation"
          value={value.observation}
          error={errors.observation}
          required
          onChange={event =>
            onChange(updateField(value, 'observation', event.target.value))
          }
        />
      </div>

      <div className="threat-form-full-width">
        <Textarea
          label="Risk"
          value={value.risk}
          error={errors.risk}
          required
          onChange={event =>
            onChange(updateField(value, 'risk', event.target.value))
          }
        />
      </div>

      <div className="threat-form-full-width">
        <Textarea
          label="Recommendation"
          value={value.recommendation}
          error={errors.recommendation}
          required
          onChange={event =>
            onChange(updateField(value, 'recommendation', event.target.value))
          }
        />
      </div>

      <div className="threat-form-full-width">
        <Input
          label="References"
          value={value.references}
          error={errors.references}
          placeholder="OWASP API1:2023, CWE-639"
          onChange={event =>
            onChange(updateField(value, 'references', event.target.value))
          }
        />
      </div>
    </div>

    <div className="threat-form-actions">
      <Button
        type="submit"
        title={isSubmitting ? 'Saving' : submitLabel}
        isLoading={isSubmitting}
      />
    </div>
  </StyledThreatForm>
);

export default ThreatForm;
