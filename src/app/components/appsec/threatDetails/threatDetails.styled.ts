import styled, { css } from 'styled-components';

const StyledThreatDetails = styled.article.attrs({
  className: 'threat-details',
})`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.m};

    padding: ${spacing.m};

    border: 1px solid ${colors.border.subtle};
    border-radius: ${radii.lg};
    background-color: ${colors.surface.card};

    .threat-details-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .threat-details-title-group {
      min-width: 0;
    }

    .threat-details-title {
      font-size: ${typography.headings.h4.size};
      line-height: ${typography.headings.h4.lineHeight};
    }

    .threat-details-id {
      margin-top: 0.125rem;

      font-family: ${typography.fontFamilies.mono};
      font-size: ${typography.mono.small.size};
      color: ${colors.text.muted};
    }

    .threat-details-badges {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .threat-details-metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      gap: ${spacing.s};

      margin: 0;
      padding: ${spacing.s};

      border-radius: ${radii.md};
      background-color: ${colors.surface.subtle};
    }

    .threat-details-metadata-item {
      min-width: 0;
    }

    .threat-details-metadata-label {
      margin-bottom: 0.125rem;

      font-size: ${typography.body.small.size};
      color: ${colors.text.muted};
    }

    .threat-details-metadata-value {
      margin: 0;
      color: ${colors.text.primary};
    }

    .threat-details-section {
      padding-top: ${spacing.s};
      border-top: 1px solid ${colors.border.subtle};
    }

    .threat-details-section-title {
      margin-bottom: ${spacing.xxs};

      font-size: ${typography.headings.h6.size};
      line-height: ${typography.headings.h6.lineHeight};
    }

    .threat-details-section-body {
      color: ${colors.text.secondary};
    }

    .threat-details-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }
  `}
`;

export default StyledThreatDetails;
