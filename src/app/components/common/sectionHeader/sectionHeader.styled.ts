import { styled, css } from 'styled-components';

const StyledSectionHeader = styled.header`
  ${({ theme: { colors, mq, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxs};

    @media ${mq.min.tablet} {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .section-header-text {
      min-width: 0;
    }

    .section-header-title {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .section-header-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.muted};
    }

    .section-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }
  `}
`;

export default StyledSectionHeader;
