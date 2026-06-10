import { styled, css } from 'styled-components';

const StyledReportPreviewShell = styled.div.attrs({
  className: 'report-preview-shell',
})`
  ${({ theme: { colors, mq, radii, shadows, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    width: 100%;

    .report-preview-shell-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .report-preview-shell-title {
      font-size: ${typography.headings.h3.size};
    }

    .report-preview-shell-subtitle {
      margin-top: ${spacing.xxxs};
      color: ${colors.text.secondary};
    }

    .report-preview-shell-toolbar {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      @media ${mq.min.tablet} {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .report-preview-shell-tabs {
      display: inline-flex;
      gap: ${spacing.xxxs};

      padding: 0.25rem;

      border-radius: ${radii.md};
      background-color: ${colors.neutral.grey100};
    }

    .report-preview-shell-tab-button {
      padding: 0.5rem 0.75rem;

      border: 0;
      border-radius: ${radii.sm};

      font-weight: ${typography.fontWeights.medium};
    }

    .report-preview-shell-tab-button--active {
      color: ${colors.text.primary};
      background-color: ${colors.surface.card};
      box-shadow: ${shadows.xs};
    }

    .report-preview-shell-tab-button--inactive {
      color: ${colors.text.secondary};
      background-color: transparent;
    }

    .report-preview-shell-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${spacing.xxs};
    }

    .report-preview-shell-auto-saved {
      color: ${colors.feedback.success};
      font-size: ${typography.body.small.size};
    }

    .report-preview-shell-stage {
      min-height: 60rem;
      padding: ${spacing.xl};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.neutral.grey100};
    }

    .report-preview-shell-paper {
      width: min(100%, 72rem);
      margin: 0 auto;
      padding: ${spacing.xxl};

      border-top: 0.375rem solid ${colors.brand.primary};
      border-radius: ${radii.md};
      background-color: ${colors.neutral.white};
      box-shadow: ${shadows.md};

      @media print {
        width: 100%;
        max-width: none;
        padding: 0;

        border-top: 0;
        box-shadow: none;
      }
    }

    @media print {
      .report-preview-shell-header,
      .report-preview-shell-toolbar {
        display: none !important;
      }

      .report-preview-shell-stage {
        min-height: auto;
        padding: 0;

        border: 0;
        background: transparent;
      }
    }
  `}
`;

export default StyledReportPreviewShell;
