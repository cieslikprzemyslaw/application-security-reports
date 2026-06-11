import React from 'react';
import { Link } from 'react-router-dom';

import StyledRouteStateView from './routeStateView.styled';

interface EntityNotFoundViewProps {
  entityName: string;
  listHref: string;
  listLabel: string;
}

const EntityNotFoundView = ({
  entityName,
  listHref,
  listLabel,
}: EntityNotFoundViewProps) => (
  <StyledRouteStateView aria-live="polite">
    <p className="route-state-eyebrow">Not found</p>

    <h1 className="route-state-title">{entityName} not found</h1>

    <p className="route-state-message">
      The requested {entityName.toLowerCase()} could not be found in this
      workspace.
    </p>

    <div className="route-state-actions">
      <Link className="route-state-action-link" to={listHref}>
        {listLabel}
      </Link>
    </div>
  </StyledRouteStateView>
);

export default EntityNotFoundView;

export type { EntityNotFoundViewProps };
