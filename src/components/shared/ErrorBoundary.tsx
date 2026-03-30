import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#222] bg-[#111] py-16 px-6">
          <div className="w-12 h-12 rounded-full bg-[#e84057]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-[#e84057]" />
          </div>
          <h3 className="text-white text-[16px] font-semibold mb-2">Something went wrong</h3>
          <p className="text-[#555] text-[13px] text-center max-w-sm mb-4">
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2 text-[13px] text-[#888] hover:text-white hover:border-[#444] transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
