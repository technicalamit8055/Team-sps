import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    const msg = error?.message || '';
    if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch') || msg.includes('Loading chunk')) {
      const reloaded = sessionStorage.getItem('auto_reloaded_chunk');
      if (!reloaded) {
        sessionStorage.setItem('auto_reloaded_chunk', 'true');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900">
          <div className="max-w-md w-full bg-white border border-slate-200 shadow-lg rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">कुछ गड़बड़ी हुई (Application Error)</h2>
              <p className="text-xs text-slate-500">
                पेज रेंडर करते समय अप्रत्याशित समस्या आई। नीचे दिए गए बटनों से तुरंत समाधान करें:
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-100 p-3 rounded-lg text-left text-[13px] font-mono text-rose-700 overflow-x-auto max-h-32 border border-slate-200">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="flex-1 text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पुनः लोड करें (Reload)</span>
              </Button>

              <Button
                size="sm"
                onClick={this.handleReset}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>डेटा रीसेट एवं होम</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
