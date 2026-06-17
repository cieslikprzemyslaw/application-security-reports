import assert from 'node:assert/strict';

import { nextSortDirection } from './assessments.utils';

// first click on an inactive column activates it with ascending direction
assert.equal(
  nextSortDirection('updated', 'type', 'desc'),
  'asc',
  'First click on inactive column should use ascending direction',
);

assert.equal(
  nextSortDirection('updated', 'name', 'asc'),
  'asc',
  'First click on inactive column should use ascending direction regardless of current direction',
);

// second click on the active column (currently asc) toggles to desc
assert.equal(
  nextSortDirection('type', 'type', 'asc'),
  'desc',
  'Second click on active ascending column should toggle to descending',
);

// second click on the active column (currently desc) toggles to asc
assert.equal(
  nextSortDirection('type', 'type', 'desc'),
  'asc',
  'Second click on active descending column should toggle to ascending',
);

// switching from one active column to a different column starts at asc
assert.equal(
  nextSortDirection('name', 'status', 'desc'),
  'asc',
  'Switching from one active column to another should start at ascending',
);

assert.equal(
  nextSortDirection('status', 'findings', 'asc'),
  'asc',
  'Switching from one active column to another should start at ascending',
);

console.log('assessments.utils nextSortDirection checks passed');
