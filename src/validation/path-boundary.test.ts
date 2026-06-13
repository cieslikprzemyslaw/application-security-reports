import assert from 'node:assert/strict';
import path from 'node:path';

import { resolvePathWithinRoot } from './index.js';

const evidenceRoot = 'uploads/evidence';
const expectedRoot = path.resolve(process.cwd(), evidenceRoot);

assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/evidence/evidence.png'),
  path.resolve(process.cwd(), 'uploads/evidence/evidence.png'),
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/evidence/reports/report.pdf'),
  path.resolve(process.cwd(), 'uploads/evidence/reports/report.pdf'),
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, '../uploads/evidence/evidence.png'),
  null,
);
assert.equal(resolvePathWithinRoot(evidenceRoot, '/tmp/evidence.png'), null);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/evidence\\evidence.png'),
  null,
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads\\evidence/evidence.png'),
  null,
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/other/file.png'),
  null,
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/evidence/../secret.png'),
  null,
);
assert.equal(
  resolvePathWithinRoot(evidenceRoot, 'uploads/evidence/./evidence.png'),
  path.resolve(process.cwd(), 'uploads/evidence/evidence.png'),
);
assert.equal(
  expectedRoot.endsWith(`${path.sep}uploads${path.sep}evidence`),
  true,
);

console.log('path boundary checks passed');
