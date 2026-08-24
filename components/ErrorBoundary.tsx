import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('QuietSend ErrorBoundary caught an unhandled render error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0d14] text-white flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full card p-6 sm:p-8 space-y-6 shadow-2xl border-black/80 border-t-red-500/30">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="h-10 w-10 rounded-xl bg-[#2d1212] border border-red-500/30 flex items-center justify-center text-[#f87171] shadow-inner">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">Enclave Exception Protected</h1>
                <p className="text-xs text-[#a0aec0] font-mono">Hardware sandbox intercepted a render failure</p>
              </div>
            </div>

            <div className="card-inset p-4 space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2 text-[#fca5a5]">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span className="font-mono font-semibold">
                  {this.state.error?.message || this.props.fallbackMessage || 'An unexpected rendering error occurred.'}
                </span>
              </div>
              <p className="text-[#718096] text-[11px] pt-1">
                Your cryptographic keys and local memory remain safe. To restore normal operation, you can attempt an enclave reset or reload the app.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary flex-1 !py-2.5 !text-xs font-bold cursor-pointer flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Reset View</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary flex-1 !py-2.5 !text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Reload Enclave</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
