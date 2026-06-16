import type { FormEvent } from 'react';

import type { AssessmentStatus } from '~/domain';

export const assessmentPresetTypes = ['Web App', 'API', 'Mobile'] as const;

export type AssessmentPresetType = (typeof assessmentPresetTypes)[number];

export type AssessmentTypeMode = 'preset' | 'custom';

export type AssessmentFormFieldName =
  | 'name'
  | 'typeMode'
  | 'presetType'
  | 'customType'
  | 'description'
  | 'scope'
  | 'status';

export interface AssessmentFormValue {
  name: string;
  typeMode: AssessmentTypeMode;
  presetType: AssessmentPresetType;
  customType: string;
  description: string;
  scope: string;
  status: AssessmentStatus;
}

export interface AssessmentFormProps {
  value: AssessmentFormValue;
  mode: 'create' | 'edit';
  errors?: Partial<Record<AssessmentFormFieldName, string>>;
  errorMessage?: string;
  isSubmitting?: boolean;
  submitLabel?: string;
  onChange: (value: AssessmentFormValue) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}
