import React from 'react';

import StyledSidebar from './sidebar.styled';

import type { SidebarProps } from './sidebar.type';

const Sidebar = ({
  brand,
  navigationGroups,
  footer,
  ariaLabel = 'Primary navigation',
  ...rest
}: SidebarProps) => (
  <StyledSidebar aria-label={ariaLabel} {...rest}>
    <div className="sidebar-brand">{brand}</div>

    <div className="sidebar-body">
      {navigationGroups.map(group => (
        <div key={group.id} className="sidebar-group">
          {group.label && <p className="sidebar-group-label">{group.label}</p>}

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

              return (
                <li key={item.id} className="sidebar-item">
                  {item.href ? (
                    <a
                      className={[
                        'sidebar-link',
                        item.isActive ? 'sidebar-link--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      href={item.href}
                      aria-current={item.isActive ? 'page' : undefined}
                      onClick={item.onClick}
                    >
                      {content}
                    </a>
                  ) : (
                    <button
                      className={[
                        'sidebar-button',
                        item.isActive ? 'sidebar-button--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      onClick={item.onClick}
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

export default Sidebar;
