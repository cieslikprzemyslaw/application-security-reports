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
