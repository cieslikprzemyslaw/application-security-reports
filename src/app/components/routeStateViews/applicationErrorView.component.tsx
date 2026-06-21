import React from 'react';
import { Link } from 'react-router-dom';

import { routes } from '~/routes';

import StyledRouteStateView from './routeStateView.styled';

interface ApplicationErrorViewProps {
  onReload: () => void;
}

const ApplicationErrorView = ({ onReload }: ApplicationErrorViewProps) => (
  <StyledRouteStateView aria-live="polite" role="alert">
    <p className="route-state-eyebrow">Application error</p>

    <h1 className="route-state-title">Something went wrong</h1>

    <p className="route-state-message">
      AppSec Report Builder could not render this screen. Use the recovery
      actions below to continue.
    </p>

    <div className="route-state-actions">
      <button
        className="route-state-action-link"
        type="button"
        onClick={onReload}
      >
        Reload application
      </button>

      <Link
        className="route-state-action-link route-state-action-link--secondary"
        to={routes.dashboard}
      >
        Back to Dashboard
      </Link>
    </div>
  </StyledRouteStateView>
);

export default ApplicationErrorView;

export type { ApplicationErrorViewProps };
