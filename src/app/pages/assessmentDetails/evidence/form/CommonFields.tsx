import React from 'react';

import Input from '~/app/components/ui/input';
import Select from '~/app/components/ui/select';
import Textarea from '~/app/components/ui/textarea';
import type { Evidence } from '~/domain';

import { evidenceTypeOptions } from './EvidenceForm.constants';
import type { EvidenceFormValue } from './EvidenceForm.mapper';
import type { EvidenceFormErrors } from './EvidenceForm.types';

interface CommonFieldsProps {
  value: EvidenceFormValue;
  errors: EvidenceFormErrors;
  onChange: (value: EvidenceFormValue) => void;
  onTypeChange: (type: Evidence['type']) => void;
}

const CommonFields = ({
  value,
  errors,
  onChange,
  onTypeChange,
}: CommonFieldsProps) => (
  <>
    <Select
      id="evidence-type"
      label="Evidence type"
      value={value.type}
      error={errors.type}
      required
      options={evidenceTypeOptions}
      onChange={event => onTypeChange(event.target.value as Evidence['type'])}
    />

    <div className="evidence-form-full-width">
      <Input
        id="evidence-title"
        label="Title"
        value={value.title}
        error={errors.title}
        required
        onChange={event =>
          onChange({
            ...value,
            title: event.target.value,
          })
        }
      />
    </div>

    <div className="evidence-form-full-width">
      <Textarea
        id="evidence-description"
        label="Description"
        value={value.description}
        error={errors.description}
        onChange={event =>
          onChange({
            ...value,
            description: event.target.value,
          })
        }
      />
    </div>

    <div className="evidence-form-full-width">
      <Textarea
        id="evidence-content"
        label="Content"
        description={
          value.type === 'http'
            ? 'Optional plain-text notes that accompany the HTTP exchanges.'
            : 'Plain-text evidence content such as terminal output, logs, or notes.'
        }
        value={value.content}
        error={errors.content}
        onChange={event =>
          onChange({
            ...value,
            content: event.target.value,
          })
        }
      />
    </div>

    <div className="evidence-form-full-width">
      <Input
        id="evidence-captured-at"
        label="Captured date"
        type="date"
        value={value.capturedAt}
        error={errors.capturedAt}
        onChange={event =>
          onChange({
            ...value,
            capturedAt: event.target.value,
          })
        }
      />
    </div>
  </>
);

export default CommonFields;
