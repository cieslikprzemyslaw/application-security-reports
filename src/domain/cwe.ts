import {
  CWE_CATALOG_4_20,
  CWE_CATALOG_4_20_METADATA,
} from '../../generated/cwe/cweCatalog.4.20.js';

export const CWE_CATALOG_CURRENT_VERSION = '4.20' as const;
export const CWE_CATALOG_SUPPORTED_VERSIONS = ['4.20'] as const;

export type CweCatalogVersion = (typeof CWE_CATALOG_SUPPORTED_VERSIONS)[number];
export type CweStatus = 'Draft' | 'Incomplete' | 'Stable' | 'Deprecated';

export interface CweCatalogEntry {
  id: string;
  name: string;
  status: CweStatus;
  deprecated: boolean;
  replacementIds: readonly string[];
}

export interface CweCatalogMetadata {
  version: CweCatalogVersion;
  releaseDate: string;
  sourceUrl: string;
  entryCount: number;
}

const catalog420: readonly CweCatalogEntry[] = CWE_CATALOG_4_20;
const catalogByVersion: Record<CweCatalogVersion, readonly CweCatalogEntry[]> =
  {
    '4.20': catalog420,
  };
const metadataByVersion: Record<CweCatalogVersion, CweCatalogMetadata> = {
  '4.20': CWE_CATALOG_4_20_METADATA,
};
const indexByVersion = Object.fromEntries(
  CWE_CATALOG_SUPPORTED_VERSIONS.map(version => [
    version,
    new Map(catalogByVersion[version].map(entry => [entry.id, entry])),
  ]),
) as Record<CweCatalogVersion, Map<string, CweCatalogEntry>>;

export const isCweCatalogVersion = (
  value: string,
): value is CweCatalogVersion =>
  CWE_CATALOG_SUPPORTED_VERSIONS.includes(value as CweCatalogVersion);

export const normalizeCweId = (value: string) => {
  const match = /^CWE-(\d+)$/i.exec(value.trim());
  return match ? `CWE-${Number(match[1])}` : undefined;
};

export const getCweCatalog = (
  version: CweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
) => catalogByVersion[version];

export const getCweCatalogMetadata = (
  version: CweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
) => metadataByVersion[version];

export const getCweCatalogEntry = (
  id: string,
  version: CweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
) => {
  const normalizedId = normalizeCweId(id);
  return normalizedId ? indexByVersion[version].get(normalizedId) : undefined;
};

export interface SearchCweCatalogOptions {
  includeDeprecated?: boolean;
  limit?: number;
}

export const searchCweCatalog = (
  query: string,
  version: CweCatalogVersion = CWE_CATALOG_CURRENT_VERSION,
  { includeDeprecated = false, limit = 20 }: SearchCweCatalogOptions = {},
): CweCatalogEntry[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase('en');
  if (!normalizedQuery) return [];

  const normalizedId = normalizeCweId(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return catalogByVersion[version]
    .filter(entry => includeDeprecated || !entry.deprecated)
    .map(entry => {
      const id = entry.id.toLocaleLowerCase('en');
      const name = entry.name.toLocaleLowerCase('en');
      const haystack = `${id} ${name}`;
      const matches = tokens.every(token => haystack.includes(token));
      const rank =
        normalizedId === entry.id
          ? 0
          : id.startsWith(normalizedQuery)
            ? 1
            : name.startsWith(normalizedQuery)
              ? 2
              : 3;
      return { entry, matches, rank };
    })
    .filter(result => result.matches)
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        Number(left.entry.id.slice(4)) - Number(right.entry.id.slice(4)),
    )
    .slice(0, Math.max(0, limit))
    .map(result => result.entry);
};
