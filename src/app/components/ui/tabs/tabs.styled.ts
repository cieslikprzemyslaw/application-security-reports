import { styled, css } from 'styled-components';

const StyledTabs = styled.div`
  ${({ theme: { colors, radii, spacing, typography } }) => css`
    width: 100%;

    .tabs-tab-list {
      display: flex;
      align-items: center;
      gap: ${spacing.s};

      overflow-x: auto;

      border-bottom: 1px solid ${colors.border.subtle};
    }

    .tabs-tab-button {
      position: relative;

      display: inline-flex;
      align-items: center;
      gap: ${spacing.xxxs};

      padding: 0 0 ${spacing.xs};

      border: 0;

      font-size: ${typography.body.medium.size};
      line-height: ${typography.body.medium.lineHeight};
      font-weight: ${typography.fontWeights.medium};

      color: ${colors.text.secondary};
      background: transparent;
      white-space: nowrap;
    }

    .tabs-tab-button--active {
      color: ${colors.brand.primary};
      font-weight: ${typography.fontWeights.semibold};
    }

    .tabs-tab-button::after {
      content: '';

      position: absolute;
      right: 0;
      bottom: -1px;
      left: 0;

      height: 2px;
      background-color: transparent;
    }

    .tabs-tab-button--active::after {
      background-color: ${colors.brand.primary};
    }

    .tabs-tab-button:hover:not(:disabled) {
      color: ${colors.text.primary};
    }

    .tabs-tab-button:disabled {
      cursor: not-allowed;
      color: ${colors.neutral.grey400};
    }

    .tabs-tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;

      border-radius: ${radii.pill};

      font-size: 0.75rem;
      line-height: 1;

      color: ${colors.text.secondary};
      background-color: ${colors.neutral.grey100};
    }

    .tabs-tab-panel {
      padding-top: ${spacing.m};
    }
  `}
`;

export default StyledTabs;
