import type { HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'small' | 'medium' | 'large';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  as?: 'section' | 'article' | 'div';
}

export interface CardBodyStyledProps {
  $padding: CardPadding;
}
