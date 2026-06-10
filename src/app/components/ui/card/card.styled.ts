import styled, { css } from 'styled-components';

import type { CardBodyStyledProps } from './card.type';

const getPadding = (padding: CardBodyStyledProps['$padding']) => {
  const values = {
    none: '0',
    small: '1rem',
    medium: '1.5rem',
    large: '2rem',
  } as const;

  return css`
    padding: ${values[padding]};
  `;
};

export const StyledCard = styled.section.attrs({ className: 'card' })`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const CardHeader = styled.header.attrs({ className: 'card-header' })`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const CardTitleGroup = styled.div.attrs({
  className: 'card-title-group',
})`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};
`;

export const CardTitle = styled.h3.attrs({ className: 'card-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h5.size};

  line-height: ${({ theme }) => theme.typography.headings.h5.lineHeight};
`;

export const CardSubtitle = styled.p.attrs({ className: 'card-subtitle' })`
  margin: 0;

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const CardActions = styled.div.attrs({ className: 'card-actions' })`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const CardBody = styled.div.attrs({
  className: 'card-body',
})<CardBodyStyledProps>`
  ${({ $padding }) => getPadding($padding)}
`;

export const CardFooter = styled.footer.attrs({ className: 'card-footer' })`
  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};

  background-color: ${({ theme }) => theme.colors.surface.subtle};
`;
