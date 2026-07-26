import { css, styled } from 'styled-components';

const StyledReportBuilderWorkspace = styled.div`
  ${({ theme: { colors, mq, radii, spacing, typography, zIndices } }) => css`
    display: grid;
    gap: ${spacing.l};

    .report-builder-section-navigation {
      position: sticky;
      top: calc(${spacing.s} + 4rem);
      z-index: ${zIndices.sticky};

      display: flex;
      gap: ${spacing.xxs};
      overflow-x: auto;
      padding: ${spacing.xs};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .report-builder-section-navigation button,
    .report-builder-progress-counts button,
    .report-builder-progress-readiness {
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      color: ${colors.text.primary};
      background-color: ${colors.surface.card};
      cursor: pointer;
    }

    .report-builder-section-navigation button {
      flex: 0 0 auto;
      padding: ${spacing.xs} ${spacing.s};
      font-weight: ${typography.fontWeights.semibold};
    }

    .report-builder-section-navigation button:hover,
    .report-builder-progress-counts button:hover,
    .report-builder-progress-readiness:hover {
      background-color: ${colors.surface.subtle};
    }

    .report-builder-section-navigation button:focus-visible,
    .report-builder-progress-counts button:focus-visible,
    .report-builder-progress-readiness:focus-visible,
    .report-builder-workspace-section:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

    .report-builder-progress,
    .report-builder-workspace-section {
      display: grid;
      gap: ${spacing.m};
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
      scroll-margin-top: 8rem;
    }

    .report-builder-progress h2,
    .report-builder-workspace-section h2,
    .report-builder-progress p,
    .report-builder-workspace-section p {
      margin: 0;
    }

    .report-builder-progress-eyebrow {
      color: ${colors.text.muted};
      font-size: ${typography.label.small.size};
      font-weight: ${typography.label.small.weight};
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .report-builder-progress-counts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: ${spacing.xs};
    }

    .report-builder-progress-counts button,
    .report-builder-progress-readiness {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxxs};
      padding: ${spacing.s};
      text-align: left;
    }

    .report-builder-progress-counts strong {
      font-size: ${typography.headings.h3.size};
    }

    .report-builder-progress-counts span,
    .report-builder-progress-readiness span {
      color: ${colors.text.muted};
      font-size: ${typography.body.small.size};
    }

    .report-builder-workspace-section {
      grid-template-columns: 1fr;
    }

    @media ${mq.min.tablet} {
      .report-builder-progress {
        grid-template-columns: minmax(12rem, 1fr) minmax(18rem, 2fr) minmax(
            10rem,
            1fr
          );
        align-items: center;
      }

      .report-builder-workspace-section {
        grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr);
        align-items: end;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      scroll-behavior: auto;
    }
  `}
`;

export default StyledReportBuilderWorkspace;
