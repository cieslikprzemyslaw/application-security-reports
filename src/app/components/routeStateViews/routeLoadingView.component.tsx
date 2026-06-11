import React from 'react';

import StyledRouteStateView from './routeStateView.styled';

const RouteLoadingView = () => (
  <StyledRouteStateView aria-live="polite" aria-busy="true" role="status">
    <div className="route-state-loading-row">
      <span className="route-state-spinner" aria-hidden="true" />

      <p className="route-state-eyebrow">Loading</p>
    </div>

    <h1 className="route-state-title">Loading route content</h1>

    <p className="route-state-message">
      Please wait while this section finishes loading.
    </p>
  </StyledRouteStateView>
);

export default RouteLoadingView;
