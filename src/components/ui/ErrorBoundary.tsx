"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} reset={this.reset} />
        );
      }

      return (
        <DefaultErrorFallback error={this.state.error} reset={this.reset} />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error?: Error;
  reset: () => void;
}) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900">
          コンポーネントエラー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-center text-sm">
          このコンポーネントの読み込み中にエラーが発生しました。
        </p>

        {process.env.NODE_ENV === "development" && error && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700 font-medium">
              エラー詳細 (開発環境)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <Button onClick={reset} size="sm" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  );
}

// Main export using function component pattern for better integration
export function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
}

// Additional specific error boundary variants
export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div className="border border-red-200 rounded-md p-4 bg-red-50">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm font-medium">
              フォームでエラーが発生しました
            </p>
          </div>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">
            再試行
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function DataErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            データの読み込みに失敗しました
          </h3>
          <p className="text-gray-600 mb-4">
            データの取得中にエラーが発生しました。
          </p>
          <Button onClick={reset} variant="outline">
            再読み込み
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
