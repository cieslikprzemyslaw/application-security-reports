import assert from 'node:assert/strict';

import {
  threatFormValueToCreateInput,
  threatFormValueToUpdateInput,
} from './assessmentDetails.mapper';
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

const formValue = {
  title: '  Missing Server-Side Authorization  ',
  owaspCategoryCode: 'A09:2021',
  customCategory: '',
  strideCategory: 'spoofing',
  severity: 'critical',
  status: 'open',
  affectedComponent: '  Orders API  ',
  affectedEndpoint: ' /api/v1/orders/{id} ',
  observation: '  Reproduce the issue  ',
  reproductionSteps: '  Reproduce the issue  ',
  risk: '  Sensitive order data is exposed.  ',
  recommendation: '  Apply object-level authorization.  ',
  references: '  OWASP API1:2023  ',
  resolutionNote: '',
  acceptedRiskJustification: '',
} as const;

const createInput = threatFormValueToCreateInput('asm_123', formValue);

assert.equal(createInput.assessmentId, 'asm_123');
assert.equal(createInput.title, 'Missing Server-Side Authorization');
assert.equal(createInput.affectedComponent, 'Orders API');
assert.equal(createInput.affectedEndpoint, '/api/v1/orders/{id}');

const updateInput = threatFormValueToUpdateInput(formValue);

assert.equal('assessmentId' in updateInput, false);
assert.equal(updateInput.title, 'Missing Server-Side Authorization');
assert.equal(updateInput.affectedComponent, 'Orders API');
assert.equal(updateInput.affectedEndpoint, '/api/v1/orders/{id}');

console.log('assessment finding validation checks passed');
