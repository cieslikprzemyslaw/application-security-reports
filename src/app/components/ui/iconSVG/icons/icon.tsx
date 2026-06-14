import type { ReactNode } from 'react';

export type IconDefinition = {
  viewBox?: string;
  children: ReactNode;
};

export const icon = (
  children: ReactNode,
  viewBox = '0 0 24 24',
): IconDefinition => ({
  viewBox,
  children,
});
