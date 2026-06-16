import assert from 'node:assert/strict';

import {
  createThreatValidationErrorMap,
  getThreatValidationErrors,
} from './assessmentDetails.validation';

const draftErrors = getThreatValidationErrors({
  title: '',
  owaspCategoryCode: '',
  customCategory: '',
  strideCategory: 'spoofing',
  severity: 'medium',
  status: 'draft',
  affectedComponent: '',
  affectedEndpoint: '',
  observation: '',
  reproductionSteps: '',
  risk: '',
  recommendation: '',
  references: '',
  resolutionNote: '',
  acceptedRiskJustification: '',
});

assert.equal(draftErrors.title, 'Title is required.');
assert.equal(draftErrors.owaspCategoryCode, 'OWASP category code is required.');

const mapped = createThreatValidationErrorMap([
  { path: 'strideCategories.0', message: 'Required' },
  { path: 'description', message: 'Description is required' },
  { path: '', message: 'At least one threat field is required' },
]);

assert.equal(mapped.fieldErrors.owaspCategoryCode, 'Required');
assert.equal(mapped.fieldErrors.observation, 'Description is required');
assert.deepEqual(mapped.generalErrors, [
  'At least one threat field is required',
]);

console.log('assessment finding validation checks passed');
