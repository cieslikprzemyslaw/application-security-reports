import type { ButtonHTMLAttributes, ReactNode } from 'react';

import type { ButtonProps } from '~/app/components/ui/button';

export interface PageActionItem {
  id: string;
  label: string;
  onActivate: () => void;
  icon?: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  isLoading?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  form?: string;
  dataAttributes?: Record<`data-${string}`, string | boolean | undefined>;
  buttonProps?: Omit<
    ButtonProps,
    'title' | 'icon' | 'variant' | 'disabled' | 'isLoading' | 'onClick'
  >;
}

export interface PageActionGroupProps {
  primaryAction?: PageActionItem;
  secondaryActions?: PageActionItem[];
  overflowActions?: PageActionItem[];
  destructiveAction?: PageActionItem;
  legacyActions?: ReactNode;
  compact?: boolean;
}
