import type { ThreatFormValue } from './threatForm.type';

export const securityFields: Array<keyof ThreatFormValue> = [
  'affectedComponent',
  'observation',
  'risk',
  'recommendation',
  'resolutionNote',
  'acceptedRiskJustification',
];

export const additionalFields: Array<keyof ThreatFormValue> = ['references'];

export const hasAnyThreatFieldValue = (
  value: ThreatFormValue,
  fields: Array<keyof ThreatFormValue>,
) => fields.some(field => String(value[field] ?? '').trim().length > 0);

export const isThreatFormFieldVisible = (
  field: keyof ThreatFormValue | undefined,
  isSecurityOpen: boolean,
  isAdditionalOpen: boolean,
) =>
  field
    ? securityFields.includes(field)
      ? isSecurityOpen
      : additionalFields.includes(field)
        ? isAdditionalOpen
        : true
    : false;
