import styled from 'styled-components';

import type { DrawerSize } from './drawer.type';

const getDrawerWidth = (size: DrawerSize) => {
  const widths = {
    small: '24rem',
    medium: '30rem',
    large: '40rem',
  } as const;

  return widths[size];
};

export const DrawerOverlay = styled.div.attrs({ className: 'drawer-overlay' })`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.drawer};

  background-color: rgb(16 24 40 / 45%);
`;

export const DrawerPanel = styled.aside.attrs({ className: 'drawer-panel' })<{
  $size: DrawerSize;
}>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;

  display: flex;
  flex-direction: column;

  width: min(100%, ${({ $size }) => getDrawerWidth($size)});

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const DrawerHeader = styled.header.attrs({ className: 'drawer-header' })`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const DrawerTitleGroup = styled.div.attrs({
  className: 'drawer-title-group',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const DrawerTitle = styled.h2.attrs({ className: 'drawer-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const DrawerDescription = styled.p.attrs({
  className: 'drawer-description',
})`
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const DrawerCloseButton = styled.button.attrs({
  className: 'drawer-close-button',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 2rem;
  height: 2rem;
  padding: 0;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme }) => theme.colors.text.secondary};
  background: transparent;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.surface.subtle};
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

export const DrawerBody = styled.div.attrs({ className: 'drawer-body' })`
  flex: 1;
  overflow-y: auto;

  padding: ${({ theme }) => theme.spacing.m};
`;

export const DrawerFooter = styled.footer.attrs({ className: 'drawer-footer' })`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;
