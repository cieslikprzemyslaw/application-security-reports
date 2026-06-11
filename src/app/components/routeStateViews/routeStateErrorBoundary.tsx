import React from 'react';

import RouteErrorView from './routeErrorView.component';

interface RouteStateErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteStateErrorBoundaryState {
  hasError: boolean;
}

class RouteStateErrorBoundary extends React.Component<
  RouteStateErrorBoundaryProps,
  RouteStateErrorBoundaryState
> {
  state: RouteStateErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (error instanceof Error) {
      console.error('Route rendering error', {
        name: error.name,
        message: error.message,
      });
      return;
    }

    console.error('Route rendering error', {
      message: 'Unknown route rendering error',
    });
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorView />;
    }

    return this.props.children;
  }
}

export default RouteStateErrorBoundary;
