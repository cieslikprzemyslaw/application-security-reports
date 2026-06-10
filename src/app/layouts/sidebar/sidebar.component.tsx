import React from 'react';

import StyledSidebar, {
  SidebarBody,
  SidebarBrand,
  SidebarButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarItemBadge,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarLink,
  SidebarList,
} from './sidebar.styled';

import type { SidebarProps } from './sidebar.type';

const Sidebar = ({
  brand,
  navigationGroups,
  footer,
  ariaLabel = 'Primary navigation',
  ...rest
}: SidebarProps) => (
  <StyledSidebar aria-label={ariaLabel} {...rest}>
    <SidebarBrand>{brand}</SidebarBrand>

    <SidebarBody>
      {navigationGroups.map(group => (
        <SidebarGroup key={group.id}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}

          <SidebarList>
            {group.items.map(item => {
              const content = (
                <>
                  {item.icon && (
                    <SidebarItemIcon aria-hidden="true">
                      {item.icon}
                    </SidebarItemIcon>
                  )}

                  <SidebarItemLabel>{item.label}</SidebarItemLabel>

                  {item.badge && (
                    <SidebarItemBadge>{item.badge}</SidebarItemBadge>
                  )}
                </>
              );

              return (
                <SidebarItem key={item.id}>
                  {item.href ? (
                    <SidebarLink
                      href={item.href}
                      aria-current={item.isActive ? 'page' : undefined}
                      $isActive={Boolean(item.isActive)}
                      onClick={item.onClick}
                    >
                      {content}
                    </SidebarLink>
                  ) : (
                    <SidebarButton
                      type="button"
                      $isActive={Boolean(item.isActive)}
                      onClick={item.onClick}
                    >
                      {content}
                    </SidebarButton>
                  )}
                </SidebarItem>
              );
            })}
          </SidebarList>
        </SidebarGroup>
      ))}
    </SidebarBody>

    {footer && <SidebarFooter>{footer}</SidebarFooter>}
  </StyledSidebar>
);

export default Sidebar;
