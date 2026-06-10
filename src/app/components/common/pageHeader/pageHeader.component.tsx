import React from 'react';

import {
  BreadcrumbItem as StyledBreadcrumbItem,
  BreadcrumbList,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderEyebrow,
  PageHeaderSubtitle,
  PageHeaderTitle,
  StyledPageHeader,
} from './pageHeader.styled';
import type { PageHeaderProps } from './pageHeader.type';

const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  breadcrumbs,
  ...rest
}: PageHeaderProps) => (
  <StyledPageHeader {...rest}>
    <PageHeaderContent>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <BreadcrumbList>
            {breadcrumbs.map(item => (
              <StyledBreadcrumbItem key={item.label}>
                {item.onClick ? (
                  <button type="button" onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <span>{item.label}</span>
                )}
              </StyledBreadcrumbItem>
            ))}
          </BreadcrumbList>
        </nav>
      )}

      {eyebrow && <PageHeaderEyebrow>{eyebrow}</PageHeaderEyebrow>}

      <PageHeaderTitle>{title}</PageHeaderTitle>

      {subtitle && <PageHeaderSubtitle>{subtitle}</PageHeaderSubtitle>}
    </PageHeaderContent>

    {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
  </StyledPageHeader>
);

export default PageHeader;
