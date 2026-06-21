import React from 'react';

import ApplicationErrorView from './applicationErrorView.component';

interface ApplicationErrorBoundaryProps {
  children: React.ReactNode;
  onReload: () => void;
  resetKey?: string;
}

interface ApplicationErrorBoundaryState {
  hasError: boolean;
}

class ApplicationErrorBoundary extends React.Component<
  ApplicationErrorBoundaryProps,
  ApplicationErrorBoundaryState
> {
  state: ApplicationErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: ApplicationErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }
  componentDidCatch(error: unknown) {
    if (error instanceof Error) {
      console.error('Application rendering error', {
        name: error.name,
        message: error.message,
      });
      return;
    }

    console.error('Application rendering error', {
      message: 'Unknown application rendering error',
    });
  }

  render() {
    if (this.state.hasError) {
      return <ApplicationErrorView onReload={this.props.onReload} />;
    }

    return this.props.children;
  }
}

export default ApplicationErrorBoundary;
