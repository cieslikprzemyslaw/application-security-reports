import type { CweCatalogVersion } from '~/domain';

export interface CweSelectorProps {
  value: string[];
  catalogVersion: CweCatalogVersion;
  error?: string;
  disabled?: boolean;
  onChange: (cweIds: string[]) => void;
}
