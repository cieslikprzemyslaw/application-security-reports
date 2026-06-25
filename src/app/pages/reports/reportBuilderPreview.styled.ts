import { css, styled } from 'styled-components';

const StyledReportBuilderPreview = styled.div`
  ${({ theme: { colors, radii, spacing } }) => css`
    display: grid;
    gap: ${spacing.m};

    .report-builder-preview-state {
      display: grid;
      min-height: 16rem;
      place-items: center;
      text-align: center;
    }

    .report-builder-preview-warnings ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .report-builder-preview-logo {
      display: block;
      max-width: 8rem;
      max-height: 4rem;
      object-fit: contain;
    }

    .report-builder-preview-risk-summary {
      display: grid;
      gap: ${spacing.m};

      padding: ${spacing.m};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    @media print {
      .report-builder-preview-warnings {
        display: none !important;
      }

      .report-builder-preview-risk-summary {
        padding: 0;
        border: 0;
      }
    }
  `}
`;

export default StyledReportBuilderPreview;
