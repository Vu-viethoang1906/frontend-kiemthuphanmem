import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // TODO: log error to service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1 style={{ color: '#c00' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
