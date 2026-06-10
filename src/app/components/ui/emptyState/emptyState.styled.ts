import styled, { css } from 'styled-components';

const StyledEmptyState = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: ${spacing.xxl} ${spacing.m};

    text-align: center;

    .empty-state-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      width: 3rem;
      height: 3rem;
      margin-bottom: ${spacing.s};

      border-radius: ${radii.circle};

      color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .empty-state-icon svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .empty-state-title {
      margin-bottom: ${spacing.xxxs};

      font-size: ${typography.headings.h5.size};
      line-height: ${typography.headings.h5.lineHeight};
    }

    .empty-state-description {
      max-width: 30rem;
      color: ${colors.text.muted};
    }

    .empty-state-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: ${spacing.xxs};

      margin-top: ${spacing.m};
    }
  `}
`;

export default StyledEmptyState;
