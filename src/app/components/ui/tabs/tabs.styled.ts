import styled from 'styled-components';

export const TabsRoot = styled.div.attrs({ className: 'tabs-root' })`
  width: 100%;
`;

export const TabList = styled.div.attrs({ className: 'tabs-tab-list' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s};

  overflow-x: auto;

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const TabButton = styled.button.attrs({ className: 'tabs-tab-button' })<{
  $isActive: boolean;
}>`
  position: relative;

  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxs};

  padding: 0 0 ${({ theme }) => theme.spacing.xs};

  border: 0;

  font-size: ${({ theme }) => theme.typography.body.medium.size};

  line-height: ${({ theme }) => theme.typography.body.medium.lineHeight};

  font-weight: ${({ theme, $isActive }) =>
    $isActive
      ? theme.typography.fontWeights.semibold
      : theme.typography.fontWeights.medium};

  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.brand.primary : theme.colors.text.secondary};

  background: transparent;

  white-space: nowrap;

  &::after {
    content: '';

    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;

    height: 2px;

    background-color: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.brand.primary : 'transparent'};
  }

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.neutral.grey400};
  }
`;

export const TabCount = styled.span.attrs({ className: 'tabs-tab-count' })`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;

  border-radius: ${({ theme }) => theme.radii.pill};

  font-size: 0.75rem;
  line-height: 1;

  color: ${({ theme }) => theme.colors.text.secondary};
  background-color: ${({ theme }) => theme.colors.neutral.grey100};
`;

export const TabPanel = styled.div.attrs({ className: 'tabs-tab-panel' })`
  padding-top: ${({ theme }) => theme.spacing.m};
`;
