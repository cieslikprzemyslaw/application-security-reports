import styled from 'styled-components';

const StyledThreatDrawer = styled.aside.attrs({ className: 'threat-drawer' })<{
  $isOpen: boolean;
}>`
  position: fixed;
  inset: 0 0 0 auto;
  z-index: ${({ theme }) => theme.zIndices.drawer};

  width: min(100%, 32rem);
  overflow-y: auto;

  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '100%')});

  transition: transform ${({ theme }) => theme.transitions.base};

  background-color: ${({ theme }) => theme.colors.surface.card};

  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const Header = styled.header.attrs({
  className: 'threat-drawer-header',
})`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s};

  padding: ${({ theme }) => theme.spacing.m};

  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const Body = styled.div.attrs({ className: 'threat-drawer-body' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.m};

  padding: ${({ theme }) => theme.spacing.m};
`;

export const Title = styled.h2.attrs({ className: 'threat-drawer-title' })`
  font-size: ${({ theme }) => theme.typography.headings.h5.size};
`;

export const Meta = styled.div.attrs({ className: 'threat-drawer-meta' })`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

export const Section = styled.section.attrs({
  className: 'threat-drawer-section',
})`
  padding-top: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

export const SectionTitle = styled.h3.attrs({
  className: 'threat-drawer-section-title',
})`
  margin-bottom: ${({ theme }) => theme.spacing.xxs};

  font-size: ${({ theme }) => theme.typography.headings.h6.size};
`;

export const CloseButton = styled.button.attrs({
  className: 'threat-drawer-close-button',
})`
  padding: 0.375rem;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme }) => theme.colors.text.secondary};

  background: transparent;
`;

export default StyledThreatDrawer;
