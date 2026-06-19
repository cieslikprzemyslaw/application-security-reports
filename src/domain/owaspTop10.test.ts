import assert from 'node:assert/strict';

import {
  OWASP_TOP_10_CURRENT_VERSION,
  OWASP_TOP_10_OPTIONS,
  OWASP_TOP_10_REGISTRY,
  getOwaspTop10CategoryByCode,
  getOwaspTop10CategoryByValue,
  getOwaspTop10CategoryOption,
  getOwaspTop10CategoryOptions,
} from './index.js';

const currentRegistry = OWASP_TOP_10_REGISTRY[OWASP_TOP_10_CURRENT_VERSION];
const expectedCategoryCodes = [
  'A01',
  'A02',
  'A03',
  'A04',
  'A05',
  'A06',
  'A07',
  'A08',
  'A09',
  'A10',
] as const;
const expectedCategoryValues = expectedCategoryCodes.map(
  code => `${code}:2025`,
);
const expectedCategoryLabels = [
  'A01:2025 - Broken Access Control',
  'A02:2025 - Security Misconfiguration',
  'A03:2025 - Software Supply Chain Failures',
  'A04:2025 - Cryptographic Failures',
  'A05:2025 - Injection',
  'A06:2025 - Insecure Design',
  'A07:2025 - Authentication Failures',
  'A08:2025 - Software or Data Integrity Failures',
  'A09:2025 - Security Logging & Alerting Failures',
  'A10:2025 - Mishandling of Exceptional Conditions',
] as const;

assert.equal(OWASP_TOP_10_CURRENT_VERSION, '2025');
assert.equal(currentRegistry.version, '2025');
assert.equal(Object.keys(currentRegistry.categories).length, 10);
assert.deepEqual(
  Object.keys(currentRegistry.categories),
  expectedCategoryCodes,
);
assert.deepEqual(
  OWASP_TOP_10_OPTIONS.map(option => option.value),
  expectedCategoryValues,
);
assert.deepEqual(
  OWASP_TOP_10_OPTIONS.map(option => option.label),
  expectedCategoryLabels,
);

assert.deepEqual(OWASP_TOP_10_OPTIONS, getOwaspTop10CategoryOptions());
assert.equal(getOwaspTop10CategoryOptions('1999').length, 0);

assert.deepEqual(getOwaspTop10CategoryOption('A01'), {
  label: 'A01:2025 - Broken Access Control',
  value: 'A01:2025',
});
assert.equal(getOwaspTop10CategoryOption('A99'), undefined);
assert.equal(getOwaspTop10CategoryByCode('A01', '2021'), undefined);

assert.equal(
  getOwaspTop10CategoryByCode('A10')?.label,
  'Mishandling of Exceptional Conditions',
);
assert.equal(getOwaspTop10CategoryByValue('A09:2025')?.code, 'A09');
assert.equal(getOwaspTop10CategoryByValue('A09:2021'), undefined);
assert.equal(getOwaspTop10CategoryByCode('A99'), undefined);

console.log('OWASP Top 10 registry checks passed');
