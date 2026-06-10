import styled from 'styled-components';

const StyledSettingsPanel = styled.section.attrs({
  className: 'settings-panel',
})`
  overflow: hidden;

  border: 1px solid ${({ theme }) => theme.colors.border.subtle};

  border-radius: ${({ theme }) => theme.radii.lg};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.xs};
`;

export const Header = styled.header.attrs({
  className: 'settings-panel-header',
})`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.xxs};

  padding: ${({ theme }) => theme.spacing.s} ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const Title = styled.h2.attrs({ className: 'settings-panel-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h6.size};
`;

export const Subtitle = styled.span.attrs({
  className: 'settings-panel-subtitle',
})`
  font-size: ${({ theme }) => theme.typography.body.small.size};

  color: ${({ theme }) => theme.colors.text.muted};
`;

export const Body = styled.div.attrs({ className: 'settings-panel-body' })`
  padding: ${({ theme }) => theme.spacing.m};
`;

export default StyledSettingsPanel;
