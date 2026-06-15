import React, { useEffect, useMemo, useRef } from 'react';

import Badge from '~/app/components/ui/badge';
import Button from '~/app/components/ui/button';
import Callout from '~/app/components/ui/callout';
import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';

import StyledAssessmentForm from './assessmentForm.styled';
import {
  assessmentPresetTypes,
  type AssessmentFormFieldName,
  type AssessmentFormProps,
  type AssessmentFormValue,
  type AssessmentPresetType,
} from './assessmentForm.type';

const statusActionLabels: Record<AssessmentFormValue['status'], string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  completed: 'Completed',
  archived: 'Archived',
};

const statusActionValues: AssessmentFormValue['status'][] = [
  'draft',
  'in-progress',
  'in-review',
  'completed',
  'archived',
];

const fieldIdMap: Record<AssessmentFormFieldName, string> = {
  name: 'assessment-name',
  typeMode: 'assessment-type-mode',
  presetType: 'assessment-preset-type',
  customType: 'assessment-custom-type',
  description: 'assessment-description',
  scope: 'assessment-scope',
  status: 'assessment-status-draft',
};

const updateField = <K extends keyof AssessmentFormValue>(
  value: AssessmentFormValue,
  field: K,
  fieldValue: AssessmentFormValue[K],
): AssessmentFormValue => ({
  ...value,
  [field]: fieldValue,
});

const AssessmentForm = ({
  value,
  mode,
  errors = {},
  errorMessage,
  isSubmitting = false,
  submitLabel = 'Save changes',
  onChange,
  onSubmit,
  onCancel,
}: AssessmentFormProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const firstErrorFieldId = useMemo(() => {
    const orderedFields: Array<AssessmentFormFieldName> = [
      'name',
      'typeMode',
      'presetType',
      'customType',
      'description',
      'scope',
      'status',
    ];

    const errorField = orderedFields.find(field => Boolean(errors[field]));

    return errorField ? fieldIdMap[errorField] : undefined;
  }, [errors]);

  useEffect(() => {
    const fieldId = firstErrorFieldId ?? 'assessment-name';
    const field = formRef.current?.querySelector<HTMLElement>(`#${fieldId}`);

    field?.focus();
  }, [firstErrorFieldId]);

  const errorSummary = Object.entries(errors).filter(([, error]) =>
    Boolean(error),
  );

  const isCustomType = value.typeMode === 'custom';
  const selectedStatusLabel = statusActionLabels[value.status];

  return (
    <StyledAssessmentForm ref={formRef} onSubmit={onSubmit} noValidate>
      {(errorMessage || errorSummary.length > 0) && (
        <Callout
          className="assessment-form-alert"
          variant="error"
          title="Could not save assessment"
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

      <div className="assessment-form-grid">
        <div className="assessment-form-full-width">
          <Input
            id="assessment-name"
            label="Assessment name"
            value={value.name}
            error={errors.name}
            required
            onChange={event =>
              onChange(updateField(value, 'name', event.target.value))
            }
          />
        </div>

        <Select
          id="assessment-type-mode"
          label="Type mode"
          value={value.typeMode}
          error={errors.typeMode}
          options={[
            { label: 'Preset type', value: 'preset' },
            { label: 'Custom type', value: 'custom' },
          ]}
          onChange={event =>
            onChange(
              updateField(
                value,
                'typeMode',
                event.target.value as AssessmentFormValue['typeMode'],
              ),
            )
          }
        />

        {isCustomType ? (
          <Input
            id="assessment-custom-type"
            label="Custom type"
            value={value.customType}
            error={errors.customType}
            required
            onChange={event =>
              onChange(updateField(value, 'customType', event.target.value))
            }
          />
        ) : (
          <Select
            id="assessment-preset-type"
            label="Preset type"
            value={value.presetType}
            error={errors.presetType}
            options={assessmentPresetTypes.map(type => ({
              label: type,
              value: type,
            }))}
            onChange={event =>
              onChange(
                updateField(
                  value,
                  'presetType',
                  event.target.value as AssessmentPresetType,
                ),
              )
            }
          />
        )}

        <div className="assessment-form-full-width">
          <Textarea
            id="assessment-description"
            label="Description"
            value={value.description}
            error={errors.description}
            onChange={event =>
              onChange(updateField(value, 'description', event.target.value))
            }
          />
        </div>

        <div className="assessment-form-full-width">
          <Textarea
            id="assessment-scope"
            label="Scope"
            value={value.scope}
            error={errors.scope}
            description="Describe the systems, workflows, and boundaries covered by the assessment."
            onChange={event =>
              onChange(updateField(value, 'scope', event.target.value))
            }
          />
        </div>
      </div>

      <section
        className="assessment-form-status-section"
        aria-labelledby="assessment-form-status-label"
      >
        <div className="assessment-form-status-header">
          <div>
            <h3 id="assessment-form-status-label">Status</h3>

            <p className="assessment-form-status-help">
              {mode === 'create'
                ? 'New assessments start in Draft.'
                : 'Use the status actions to update the assessment state.'}
            </p>
          </div>

          <Badge label={selectedStatusLabel} variant="neutral" size="small" />
        </div>

        {mode === 'edit' ? (
          <div
            className="assessment-form-status-actions"
            role="group"
            aria-label="Assessment status actions"
          >
            {statusActionValues.map(status => (
              <Button
                key={status}
                id={`assessment-status-${status}`}
                title={statusActionLabels[status]}
                variant={value.status === status ? 'primary' : 'secondary'}
                isSelected={value.status === status}
                aria-pressed={value.status === status}
                onClick={() => onChange(updateField(value, 'status', status))}
              />
            ))}
          </div>
        ) : (
          <p className="assessment-form-status-note">
            The assessment will be created as <strong>Draft</strong>.
          </p>
        )}
      </section>

      <div className="assessment-form-actions">
        <Button
          title="Cancel"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        />

        <Button type="submit" title={submitLabel} isLoading={isSubmitting} />
      </div>
    </StyledAssessmentForm>
  );
};

export default AssessmentForm;
