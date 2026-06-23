import { css, styled } from 'styled-components';

const StyledReportBuilderSelectionTree = styled.section.attrs({
  className: 'report-builder-selection-tree',
})`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .report-builder-selection-tree-intro {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
    }

    .report-builder-selection-tree-eyebrow {
      margin: 0;

      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .report-builder-selection-tree-title {
      font-size: ${typography.headings.h4.size};
    }

    .report-builder-selection-tree-copy {
      max-width: 60ch;
      color: ${colors.text.secondary};
    }

    .report-builder-selection-tree-control {
      padding: ${spacing.m};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .report-builder-selection-tree-assessment {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .report-builder-selection-tree-assessment-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .report-builder-selection-tree-assessment-label {
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .report-builder-selection-tree-assessment-title {
      font-size: ${typography.headings.h5.size};
    }

    .report-builder-selection-tree-threat-list,
    .report-builder-selection-tree-evidence-list {
      display: flex;
      flex-direction: column;
      gap: ${spacing.s};

      margin: 0;
      padding: 0;

      list-style: none;
    }

    .report-builder-selection-tree-threat-item {
      padding: ${spacing.m};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.lg};
      background-color: ${colors.surface.card};
    }

    .report-builder-selection-tree-evidence-list {
      margin-top: ${spacing.m};
      padding-left: ${spacing.l};

      border-left: 1px solid ${colors.border.subtle};
    }

    .report-builder-selection-tree-evidence-item {
      padding: ${spacing.s};

      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .report-builder-selection-tree-empty {
      color: ${colors.text.secondary};
    }
  `}
`;

export default StyledReportBuilderSelectionTree;
