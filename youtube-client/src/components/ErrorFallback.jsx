import React from 'react';
import Button from './Button.jsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 my-8">
      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-4">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-slate-400 max-w-md mb-6 text-sm">
        {error?.message || 'An unexpected error occurred in the application.'}
      </p>
      {resetErrorBoundary && (
        <Button onClick={resetErrorBoundary} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorFallback;
