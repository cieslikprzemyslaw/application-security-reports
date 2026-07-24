import type { ReactNode } from 'react';
import type { To } from 'react-router-dom';

interface CollectionRowActionBaseProps {
  label: string;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  isSelected?: boolean;
  [key: `data-${string}`]: string | number | boolean | undefined;
}

export interface CollectionRowLinkActionProps
  extends CollectionRowActionBaseProps {
  to: To;
  onActivate?: never;
  replace?: boolean;
}

export interface CollectionRowButtonActionProps
  extends CollectionRowActionBaseProps {
  to?: never;
  onActivate: () => void;
  replace?: never;
}

export type CollectionRowActionProps =
  | CollectionRowLinkActionProps
  | CollectionRowButtonActionProps;
