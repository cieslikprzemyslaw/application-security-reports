import assert from 'node:assert/strict';

import { getOwaspTop10CategoryOption } from '~/domain';

import {
  threatFormValueToCreateInput,
  threatFormValueToUpdateInput,
  toAssessmentViewModel,
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

const owaspCategoryValue = (code: string) =>
  getOwaspTop10CategoryOption(code)?.value ?? `${code}:2025`;

assert.equal(mapped.fieldErrors.owaspCategoryCode, 'Required');
assert.equal(mapped.fieldErrors.observation, 'Description is required');
assert.deepEqual(mapped.generalErrors, [
  'At least one threat field is required',
]);

const formValue = {
  title: '  Missing Server-Side Authorization  ',
  owaspCategoryCode: owaspCategoryValue('A09'),
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

const assessmentView = toAssessmentViewModel({
  company: {
    id: 'cmp_1',
    name: 'Northstar Digital',
  },
  assessment: {
    id: 'asm_1',
    companyId: 'cmp_1',
    title: 'Customer Services Portal',
    description: 'Assessment of the customer portal',
    scope: 'Web application',
    status: 'in-progress',
    startedAt: '2026-06-01',
    completedAt: '2026-06-10',
    applicationName: 'Customer Services Portal',
    environment: 'Production',
    assessmentType: 'Web App',
    overallRisk: 'high',
    owaspTaxonomyVersion: '2025',
    cweCatalogVersion: '4.20',
    archivedAt: null,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-11T09:00:00.000Z',
    recordVersion: 3,
    findingsCount: 7,
    evidenceCount: 2,
    reportVersionCount: 1,
    testerName: 'Alex Mercer',
    availableActions: ['complete', 'archive'],
  },
});

assert.equal(assessmentView.startedAt, '2026-06-01');
assert.equal(assessmentView.completedAt, '2026-06-10');
assert.equal(assessmentView.companyName, 'Northstar Digital');

console.log('assessment finding validation checks passed');
