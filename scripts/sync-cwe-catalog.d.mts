export interface CweSourceWeakness {
  ID: string;
  Name: string;
  Status: 'Draft' | 'Incomplete' | 'Stable' | 'Deprecated';
  Description?: string;
  ContentHistory?: Array<Record<string, string>>;
}

export interface CweSourcePayload {
  Weaknesses: CweSourceWeakness[];
}

export function normalizeWeaknesses(payload: CweSourcePayload): {
  entries: Array<{
    id: string;
    name: string;
    status: CweSourceWeakness['Status'];
    deprecated: boolean;
    replacementIds: string[];
  }>;
  metadata: { version: string; releaseDate: string };
};
export function renderCatalogModule(entries: unknown[]): string;
export function syncCweCatalog(options?: {
  inputPath?: string;
  outputPath?: string;
}): Promise<{ outputPath: string; entryCount: number }>;
