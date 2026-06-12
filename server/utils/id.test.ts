import assert from 'node:assert/strict';

import { generateId, type EntityType } from './id.js';

const UUID_BODY =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const UUID_SUFFIX_PATTERN = new RegExp(`^${UUID_BODY}$`, 'i');

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cases: Array<[EntityType, string]> = [
  ['company', 'cmp_'],
  ['assessment', 'asm_'],
  ['threat', 'thr_'],
  ['evidence', 'evd_'],
  ['report', 'rpt_'],
  ['activity', 'act_'],
  ['settings', 'set_'],
];

for (const [entityType, prefix] of cases) {
  const ids = new Set<string>();

  for (let index = 0; index < 16; index += 1) {
    const id = generateId(entityType);

    assert.ok(
      id.startsWith(prefix),
      `Expected ${entityType} IDs to start with ${prefix}`,
    );

    const suffix = id.slice(prefix.length);
    assert.match(
      suffix,
      UUID_SUFFIX_PATTERN,
      `Expected ${entityType} IDs to end with a UUID`,
    );
    assert.match(
      id,
      new RegExp(`^${escapeRegExp(prefix)}${UUID_BODY}$`, 'i'),
      `Expected ${entityType} IDs to match the full prefixed UUID format`,
    );

    ids.add(id);
  }

  assert.equal(
    ids.size,
    16,
    `Expected ${entityType} IDs to be unique across a small sample`,
  );
}

assert.throws(
  () => generateId('unsupported' as never),
  /Unsupported entity type for ID generation: unsupported/,
);

assert.throws(
  () => generateId('' as never),
  /Unsupported entity type for ID generation: /,
);

if (process.env.NODE_ENV === '__typecheck_only__') {
  // @ts-expect-error Unsupported entity types must fail at compile time.
  generateId('project');
}

console.log('id utility checks passed');
