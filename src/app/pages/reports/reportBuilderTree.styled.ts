import { css, styled } from 'styled-components';

const StyledReportBuilderTree = styled.section.attrs({
  className: 'report-builder-tree',
})`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};

    .report-builder-tree-header {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xxs};
    }

    .report-builder-tree-eyebrow {
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .report-builder-tree-title {
      font-size: ${typography.headings.h4.size};
    }

    .report-builder-tree-subtitle {
      color: ${colors.text.secondary};
    }

    .report-builder-tree-state {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .report-builder-tree-error-actions {
      display: flex;
      flex-wrap: wrap;
      gap: ${spacing.xxs};
    }

    .report-builder-tree-company {
      display: flex;
      flex-direction: column;
      gap: ${spacing.m};
    }

    .report-builder-tree-company-meta {
      color: ${colors.text.secondary};
    }

    .report-builder-tree-list,
    .report-builder-tree-children {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .report-builder-tree-children {
      margin-left: ${spacing.m};
      padding-left: ${spacing.m};
      border-left: 1px solid ${colors.border.subtle};
    }

    .report-builder-tree-item {
      margin: 0;
    }

    .report-builder-tree-node-subtree {
      margin-top: ${spacing.xs};
    }

    .report-builder-tree-empty-node {
      padding: ${spacing.xs} ${spacing.m};
      color: ${colors.text.secondary};
    }

    .report-builder-tree-summary {
      display: flex;
      flex-direction: column;
      gap: ${spacing.xs};
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.subtle};
    }

    .report-builder-tree-summary-title {
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .report-builder-tree-summary-json {
      margin: 0;
      overflow-x: auto;
      color: ${colors.text.primary};
      font-size: ${typography.body.small.size};
      white-space: pre-wrap;
      word-break: break-word;
    }

    @media ${mq.max.tablet} {
      .report-builder-tree-summary {
        padding: ${spacing.s};
      }
    }
  `}
`;

export default StyledReportBuilderTree;
