import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  // Size mapping for consistent spinner sizes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated spinner using Lucide React icon */}
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-blue-600 mb-2`}
        aria-hidden="true"
      />
      {/* Screen reader accessible loading text */}
      <p className="text-sm text-gray-600 animate-pulse" aria-live="polite">
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner; 