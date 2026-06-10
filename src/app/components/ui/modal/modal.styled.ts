import styled, { css } from 'styled-components';

import type { ModalSize } from './modal.type';

const getModalWidth = (size: ModalSize) => {
  const widths = {
    small: '26rem',
    medium: '36rem',
    large: '52rem',
  } as const;

  return widths[size];
};

export const ModalOverlay = styled.div.attrs({ className: 'modal-overlay' })`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndices.modal};

  display: grid;
  place-items: center;

  padding: ${({ theme }) => theme.spacing.m};

  background-color: rgb(16 24 40 / 55%);
`;

export const ModalDialog = styled.div.attrs({ className: 'modal-dialog' })<{
  $size: ModalSize;
}>`
  width: min(100%, ${({ $size }) => getModalWidth($size)});

  max-height: calc(100vh - 3rem);
  overflow: auto;

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const ModalHeader = styled.header.attrs({ className: 'modal-header' })`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const ModalTitleGroup = styled.div.attrs({
  className: 'modal-title-group',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const ModalTitle = styled.h2.attrs({ className: 'modal-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h4.size};

  line-height: ${({ theme }) => theme.typography.headings.h4.lineHeight};
`;

export const ModalDescription = styled.p.attrs({
  className: 'modal-description',
})`
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ModalCloseButton = styled.button.attrs({
  className: 'modal-close-button',
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

export const ModalBody = styled.div.attrs({ className: 'modal-body' })`
  padding: ${({ theme }) => theme.spacing.m};
`;

export const ModalFooter = styled.footer.attrs({ className: 'modal-footer' })`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;
