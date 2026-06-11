import React from 'react';
import { Link } from 'react-router-dom';

import StyledRouteStateView from './routeStateView.styled';

import { routes } from '~/routes';

const RouteErrorView = () => (
  <StyledRouteStateView aria-live="polite" role="alert">
    <p className="route-state-eyebrow">Route error</p>

    <h1 className="route-state-title">Something went wrong</h1>

    <p className="route-state-message">
      We could not render this route. Please return to the Dashboard and try
      again.
    </p>

    <div className="route-state-actions">
      <Link className="route-state-action-link" to={routes.dashboard}>
        Back to Dashboard
      </Link>
    </div>
  </StyledRouteStateView>
);

export default RouteErrorView;
