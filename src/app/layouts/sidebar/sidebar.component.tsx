import React from 'react';
import { NavLink, useInRouterContext } from 'react-router-dom';

import IconSVG from '~/app/components/ui/iconSVG';
import StyledSidebar from './sidebar.styled';

import type { SidebarProps } from './sidebar.type';

const Sidebar = ({
  brand,
  navigationGroups,
  footer,
  ariaLabel = 'Primary navigation',
  isOpen = false,
  onClose,
  ...rest
}: SidebarProps) => {
  const inRouterContext = useInRouterContext();

  const handleItemClick = (itemOnClick?: () => void) => {
    itemOnClick?.();

    if (isOpen) {
      onClose?.();
    }
  };

  return (
    <StyledSidebar
      aria-label={ariaLabel}
      data-is-open={isOpen ? 'true' : 'false'}
      {...rest}
    >
      <div className="sidebar-brand">
        <div className="sidebar-brand-content">{brand}</div>

        {onClose && (
          <div className="sidebar-brand-actions">
            <button
              type="button"
              className="sidebar-close-button"
              aria-label="Close navigation"
              onClick={onClose}
            >
              <IconSVG name="close" />
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-body">
        {navigationGroups.map(group => (
          <div key={group.id} className="sidebar-group">
            {group.label && (
              <p className="sidebar-group-label">{group.label}</p>
            )}

            <ul className="sidebar-list">
              {group.items.map(item => {
                const content = (
                  <>
                    {item.icon && (
                      <span className="sidebar-item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}

                    <span className="sidebar-item-label">{item.label}</span>

                    {item.badge && (
                      <span className="sidebar-item-badge">{item.badge}</span>
                    )}
                  </>
                );
                const isInternalHref = Boolean(item.href?.startsWith('/'));
                const isItemActive = Boolean(item.isActive);

                return (
                  <li key={item.id} className="sidebar-item">
                    {item.href && inRouterContext && isInternalHref ? (
                      <NavLink
                        className={({ isActive }) =>
                          [
                            'sidebar-link',
                            isActive || isItemActive
                              ? 'sidebar-link--active'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')
                        }
                        to={item.href}
                        aria-current={isItemActive ? 'page' : undefined}
                        onClick={() => handleItemClick(item.onClick)}
                      >
                        {content}
                      </NavLink>
                    ) : item.href ? (
                      <a
                        className={[
                          'sidebar-link',
                          isItemActive ? 'sidebar-link--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        href={item.href}
                        aria-current={isItemActive ? 'page' : undefined}
                        onClick={() => handleItemClick(item.onClick)}
                      >
                        {content}
                      </a>
                    ) : (
                      <button
                        className={[
                          'sidebar-button',
                          isItemActive ? 'sidebar-button--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        type="button"
                        aria-current={isItemActive ? 'page' : undefined}
                        onClick={() => handleItemClick(item.onClick)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {footer && <div className="sidebar-footer">{footer}</div>}
    </StyledSidebar>
  );
};

export default Sidebar;
