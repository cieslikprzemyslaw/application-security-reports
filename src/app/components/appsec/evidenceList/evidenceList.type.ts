import type { HTMLAttributes, ReactNode } from 'react';

export type EvidenceKind =
  | 'image'
  | 'request'
  | 'response'
  | 'code'
  | 'document'
  | 'other';

export interface EvidenceItem {
  id: string;
  filename: string;
  kind?: EvidenceKind;
  mimeType?: string;
  sizeLabel?: string;
  previewUrl?: string;
  description?: string;
  icon?: ReactNode;
}

export interface EvidenceListProps extends HTMLAttributes<HTMLUListElement> {
  items: EvidenceItem[];
  emptyState?: ReactNode;
  onOpen?: (item: EvidenceItem) => void;
  onRemove?: (item: EvidenceItem) => void;
}
