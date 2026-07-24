import React from 'react';

import PageActionGroup from '../pageActionGroup';
import WorkspaceContextNavigation from '../workspaceContextNavigation';
import StyledPageHeader from './pageHeader.styled';
import type { PageHeaderProps } from './pageHeader.type';

const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  breadcrumbs,
  context,
  documentTitle,
  primaryAction,
  secondaryActions,
  overflowActions,
  destructiveAction,
  titleRef,
  titleId,
  ...rest
}: PageHeaderProps) => {
  const contextItems = context ?? breadcrumbs ?? [];
  const hasActionHierarchy = Boolean(
    actions ||
      primaryAction ||
      secondaryActions?.length ||
      overflowActions?.length ||
      destructiveAction,
  );

  return (
    <StyledPageHeader className="page-header" {...rest}>
      <div className="page-header-content">
        <WorkspaceContextNavigation
          items={contextItems}
          documentTitle={documentTitle ?? title}
        />

        {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}

        <h1
          id={titleId}
          ref={titleRef}
          className="page-header-title"
          tabIndex={titleRef ? -1 : undefined}
        >
          {title}
        </h1>

        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>

      {hasActionHierarchy && (
        <div className="page-header-actions">
          <PageActionGroup
            primaryAction={primaryAction}
            secondaryActions={secondaryActions}
            overflowActions={overflowActions}
            destructiveAction={destructiveAction}
            legacyActions={actions}
          />
        </div>
      )}
    </StyledPageHeader>
  );
};

export default PageHeader;
