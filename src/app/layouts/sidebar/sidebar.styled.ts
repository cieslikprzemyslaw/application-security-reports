import styled from 'styled-components';

const StyledSidebar = styled.nav.attrs({ className: 'sidebar' })`
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  min-height: 100vh;

  color: ${({ theme }) => theme.colors.text.inverse};

  background-color: ${({ theme }) => theme.colors.surface.inverse};
`;

export const SidebarBrand = styled.div.attrs({ className: 'sidebar-brand' })`
  display: flex;
  align-items: center;

  min-height: ${({ theme }) => theme.layoutSizes.topbarHeight};

  padding: 0 ${({ theme }) => theme.spacing.s};

  border-bottom: 1px solid rgb(255 255 255 / 10%);
`;

export const SidebarBody = styled.div.attrs({ className: 'sidebar-body' })`
  flex: 1;
  overflow-y: auto;

  padding: ${({ theme }) => theme.spacing.s};
`;

export const SidebarGroup = styled.div.attrs({ className: 'sidebar-group' })`
  & + & {
    margin-top: ${({ theme }) => theme.spacing.m};
  }
`;

export const SidebarGroupLabel = styled.p.attrs({
  className: 'sidebar-group-label',
})`
  margin: 0 0 ${({ theme }) => theme.spacing.xxs};

  padding: 0 ${({ theme }) => theme.spacing.xxs};

  font-size: ${({ theme }) => theme.typography.label.small.size};

  line-height: ${({ theme }) => theme.typography.label.small.lineHeight};

  font-weight: ${({ theme }) => theme.typography.label.small.weight};

  color: ${({ theme }) => theme.colors.neutral.grey400};

  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

export const SidebarList = styled.ul.attrs({ className: 'sidebar-list' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxs};

  margin: 0;
  padding: 0;

  list-style: none;
`;

export const SidebarItem = styled.li.attrs({ className: 'sidebar-item' })``;

export const SidebarLink = styled.a.attrs({ className: 'sidebar-link' })<{
  $isActive: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;

  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.neutral.white : theme.colors.neutral.grey300};

  background-color: ${({ $isActive }) =>
    $isActive ? 'rgb(255 255 255 / 10%)' : 'transparent'};

  text-decoration: none;

  transition:
    color ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.neutral.white};

    background-color: rgb(255 255 255 / 8%);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};

    outline-offset: 2px;
  }
`;

export const SidebarButton = styled.button.attrs({
  className: 'sidebar-button',
})<{
  $isActive: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};

  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;

  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};

  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.neutral.white : theme.colors.neutral.grey300};

  background-color: ${({ $isActive }) =>
    $isActive ? 'rgb(255 255 255 / 10%)' : 'transparent'};

  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.colors.neutral.white};

    background-color: rgb(255 255 255 / 8%);
  }
`;

export const SidebarItemIcon = styled.span.attrs({
  className: 'sidebar-item-icon',
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`;

export const SidebarItemLabel = styled.span.attrs({
  className: 'sidebar-item-label',
})`
  min-width: 0;
  flex: 1;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SidebarItemBadge = styled.span.attrs({
  className: 'sidebar-item-badge',
})`
  flex-shrink: 0;
`;

export const SidebarFooter = styled.div.attrs({ className: 'sidebar-footer' })`
  padding: ${({ theme }) => theme.spacing.s};

  border-top: 1px solid rgb(255 255 255 / 10%);
`;

export default StyledSidebar;
