import styled, { css } from 'styled-components';

import type { CardPadding } from './card.type';

const getPadding = (padding: CardPadding) => {
  const values = {
    none: '0',
    small: '1rem',
    medium: '1.5rem',
    large: '2rem',
  } as const;

  return values[padding];
};

const StyledCard = styled.section`
  ${({ theme: { colors, radii, shadows, spacing, typography } }) => css`
    overflow: hidden;

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background-color: ${colors.surface.card};
    box-shadow: ${shadows.xs};

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      padding: ${spacing.m};

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .card-title-group {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
    }

    .card-title {
      font-size: ${typography.headings.h5.size};
      line-height: ${typography.headings.h5.lineHeight};
    }

    .card-subtitle {
      margin: 0;
      color: ${colors.text.muted};
    }

    .card-actions {
      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .card-body {
      padding: var(--card-padding, ${spacing.m});
    }

    .card-footer {
      padding: ${spacing.s} ${spacing.m};

      border-top: 1px solid ${colors.border.subtle};
      background-color: ${colors.surface.subtle};
    }
  `}
`;

export { getPadding };
export default StyledCard;
