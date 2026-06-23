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

    .report-builder-tree-node-button {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: ${spacing.s};

      width: 100%;
      padding: ${spacing.s} ${spacing.m};

      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
      color: ${colors.text.primary};
      text-align: left;
    }

    .report-builder-tree-node-button:hover {
      border-color: ${colors.border.strong};
    }

    .report-builder-tree-node-button:focus-visible {
      outline: 0.1875rem solid ${colors.feedback.info};
      outline-offset: 0.125rem;
    }

    .report-builder-tree-node-button--selected {
      border-color: ${colors.brand.primary};
      background-color: ${colors.brand.wash};
    }

    .report-builder-tree-node-copy {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: ${spacing.xxxs};
      min-width: 0;
    }

    .report-builder-tree-node-title {
      font-weight: ${typography.fontWeights.medium};
      overflow-wrap: anywhere;
    }

    .report-builder-tree-node-meta {
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      overflow-wrap: anywhere;
    }

    .report-builder-tree-node-state {
      flex-shrink: 0;
      color: ${colors.text.secondary};
      font-size: ${typography.body.small.size};
      font-weight: ${typography.fontWeights.medium};
      white-space: nowrap;
    }

    .report-builder-tree-node-subtree {
      margin-top: ${spacing.xs};
    }

    .report-builder-tree-empty-node {
      padding: ${spacing.xs} ${spacing.m};
      color: ${colors.text.secondary};
    }

    @media ${mq.max.tablet} {
      .report-builder-tree-node-button {
        flex-direction: column;
      }

      .report-builder-tree-node-state {
        white-space: normal;
      }
    }
  `}
`;

export default StyledReportBuilderTree;
