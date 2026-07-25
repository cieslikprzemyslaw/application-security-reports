import { css, styled } from 'styled-components';

const StyledReportBuilderTree = styled.section.attrs({
  className: 'report-builder-tree',
})`
  ${({ theme: { colors, mq, radii, spacing, typography } }) => css`
    display: flex;
    flex-direction: column;
    gap: ${spacing.l};
    color: ${colors.text.primary};
    scroll-margin-top: 8rem;

    &:focus {
      outline: none;
    }

    &:focus-visible,
    .report-builder-tree-configuration:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 2px;
    }

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
      color: ${colors.text.primary};
      font-size: ${typography.headings.h4.size};
    }

    .report-builder-tree-subtitle {
      color: ${colors.text.secondary};
    }

    .report-builder-tree-filter {
      display: flex;
      align-items: flex-end;
      gap: ${spacing.xs};
      margin-top: ${spacing.m};
    }

    .report-builder-tree-filter > div:first-child {
      flex: 1;
    }

    .report-builder-tree-configuration {
      display: grid;
      gap: ${spacing.m};
      margin: ${spacing.m} 0;
      padding: ${spacing.m};
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.subtle};
      scroll-margin-top: 8rem;
    }

    .report-builder-tree-configuration h3,
    .report-builder-tree-configuration p {
      margin: 0;
    }

    .report-builder-tree-configuration-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: ${spacing.s};
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

    .report-builder-tree-assessment {
      overflow: hidden;
      border: 1px solid ${colors.border.subtle};
      border-radius: ${radii.md};
      background-color: ${colors.surface.card};
    }

    .report-builder-tree-assessment-header {
      display: flex;
      align-items: flex-start;
      gap: ${spacing.xs};
      padding: ${spacing.m};
    }

    .report-builder-tree-assessment-selection {
      flex: 1;
      min-width: 0;
    }

    .report-builder-tree-assessment-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 1px solid transparent;
      border-radius: ${radii.sm};
      background: transparent;
      color: ${colors.text.secondary};
      cursor: pointer;
    }

    .report-builder-tree-assessment-toggle:hover {
      border-color: ${colors.border.subtle};
      background-color: ${colors.surface.subtle};
      color: ${colors.text.primary};
    }

    .report-builder-tree-assessment-toggle:focus-visible {
      outline: 2px solid ${colors.border.focus};
      outline-offset: 0.125rem;
    }

    .report-builder-tree-assessment-panel {
      padding: 0 ${spacing.m} ${spacing.m};
      border-top: 1px solid ${colors.border.subtle};
    }

    .report-builder-tree-assessment-panel[hidden] {
      display: none;
    }

    .report-builder-tree-assessment-panel > .report-builder-tree-node-subtree {
      margin-top: ${spacing.m};
    }

    .report-builder-tree-node-subtree {
      margin-top: ${spacing.xs};
    }

    .report-builder-tree-empty-node {
      padding: ${spacing.xs} ${spacing.m};
      color: ${colors.text.secondary};
    }

    @media ${mq.min.tablet} {
      .report-builder-tree-configuration-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `}
`;

export default StyledReportBuilderTree;
