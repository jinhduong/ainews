import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  retryLabel = 'Try Again' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      {/* Error icon with semantic color */}
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
      
      {/* Error message with proper typography */}
      <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
      <p className="text-red-600 text-center mb-4 max-w-md">{message}</p>
      
      {/* Retry button if onRetry function is provided */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label={`${retryLabel} - Retry loading news`}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage; 