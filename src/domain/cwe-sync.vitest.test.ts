import { describe, expect, it } from 'vitest';

import {
  normalizeWeaknesses,
  renderCatalogModule,
} from '../../scripts/sync-cwe-catalog.mjs';

const buildPayload = (entryCount = 969) => ({
  Weaknesses: Array.from({ length: entryCount }, (_, index) => {
    const id = entryCount - index;
    return {
      ID: String(id),
      Name: `Weakness ${id}`,
      Status: 'Stable' as const,
      ContentHistory: [
        {
          ModificationVersion: '4.20',
          ModificationReleaseDate: '2026-04-30',
        },
      ],
    };
  }),
});

describe('CWE catalog synchronisation', () => {
  it('normalizes and renders the pinned release deterministically', () => {
    const first = normalizeWeaknesses(buildPayload());
    const second = normalizeWeaknesses(buildPayload());

    expect(first).toEqual(second);
    expect(first.entries).toHaveLength(969);
    expect(first.entries[0]?.id).toBe('CWE-1');
    expect(first.entries.at(-1)?.id).toBe('CWE-969');
    expect(renderCatalogModule(first.entries)).toBe(
      renderCatalogModule(second.entries),
    );
  });

  it('fails closed when upstream release expectations change', () => {
    expect(() => normalizeWeaknesses(buildPayload(968))).toThrow(
      'Unexpected CWE release',
    );
  });
});
