import React from 'react';

import StyledPageHeader from './pageHeader.styled';
import type { PageHeaderProps } from './pageHeader.type';

const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  breadcrumbs,
  ...rest
}: PageHeaderProps) => (
  <StyledPageHeader className="page-header" {...rest}>
    <div className="page-header-content">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="page-header-breadcrumb-list">
            {breadcrumbs.map(item => (
              <li key={item.label} className="page-header-breadcrumb-item">
                {item.onClick ? (
                  <button type="button" onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}

      <h1 className="page-header-title">{title}</h1>

      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
    </div>

    {actions && <div className="page-header-actions">{actions}</div>}
  </StyledPageHeader>
);

export default PageHeader;
