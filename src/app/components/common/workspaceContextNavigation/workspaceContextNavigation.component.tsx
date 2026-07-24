import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import StyledWorkspaceContextNavigation from './workspaceContextNavigation.styled';
import type { WorkspaceContextNavigationProps } from './workspaceContextNavigation.type';

const applicationTitle = 'AppSec Report Builder';

const WorkspaceContextNavigation = ({
  items,
  ariaLabel = 'Workspace context',
  documentTitle,
}: WorkspaceContextNavigationProps) => {
  useEffect(() => {
    const resolvedTitle = documentTitle?.trim();
    const nextTitle = resolvedTitle
      ? `${resolvedTitle} | ${applicationTitle}`
      : applicationTitle;

    document.title = nextTitle;

    return () => {
      if (document.title === nextTitle) {
        document.title = applicationTitle;
      }
    };
  }, [documentTitle]);

  if (items.length === 0) {
    return null;
  }

  return (
    <StyledWorkspaceContextNavigation aria-label={ariaLabel}>
      <ol className="workspace-context-navigation__list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li
              key={`${item.label}:${index}`}
              className="workspace-context-navigation__item"
            >
              {isCurrent ? (
                <span
                  className="workspace-context-navigation__current"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  className="workspace-context-navigation__link"
                  to={item.href}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : item.onClick ? (
                <button
                  type="button"
                  className="workspace-context-navigation__link"
                  title={item.label}
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              ) : (
                <span title={item.label}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </StyledWorkspaceContextNavigation>
  );
};

export default WorkspaceContextNavigation;
