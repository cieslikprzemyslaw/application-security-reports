import { describe, expect, it } from 'vitest';

import {
  CWE_CATALOG_CURRENT_VERSION,
  getCweCatalog,
  getCweCatalogEntry,
  getCweCatalogMetadata,
  normalizeCweId,
  searchCweCatalog,
} from './cwe.js';

describe('CWE catalog', () => {
  it('exposes the pinned MITRE 4.20 catalog deterministically', () => {
    const catalog = getCweCatalog();
    const metadata = getCweCatalogMetadata();

    expect(CWE_CATALOG_CURRENT_VERSION).toBe('4.20');
    expect(metadata).toEqual({
      version: '4.20',
      releaseDate: '2026-04-30',
      sourceUrl: 'https://cwe-api.mitre.org/api/v1/cwe/weakness/all',
      entryCount: 969,
    });
    expect(catalog).toHaveLength(969);
    expect(catalog.map(entry => Number(entry.id.slice(4)))).toEqual(
      [...catalog]
        .map(entry => Number(entry.id.slice(4)))
        .sort((left, right) => left - right),
    );
  });

  it('normalizes IDs and prioritizes an exact CWE match', () => {
    expect(normalizeCweId(' cwe-00079 ')).toBe('CWE-79');
    expect(normalizeCweId('79')).toBeUndefined();
    expect(getCweCatalogEntry('cwe-79')?.id).toBe('CWE-79');
    expect(searchCweCatalog('CWE-79')[0]?.id).toBe('CWE-79');
  });

  it('hides deprecated entries unless historical lookup is requested', () => {
    const deprecated = getCweCatalog().find(entry => entry.deprecated);

    expect(deprecated).toBeDefined();
    expect(getCweCatalogEntry(deprecated!.id)).toEqual(deprecated);
    expect(
      searchCweCatalog(deprecated!.id).map(entry => entry.id),
    ).not.toContain(deprecated!.id);
    expect(
      searchCweCatalog(deprecated!.id, '4.20', { includeDeprecated: true })[0],
    ).toEqual(deprecated);
  });
});
