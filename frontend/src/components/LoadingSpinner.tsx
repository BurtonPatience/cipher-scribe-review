import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
  variant?: 'default' | 'minimal' | 'card';
}

export function LoadingSpinner({
  size = 'md',
  className,
  text,
  showProgress = false,
  progress,
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'flex flex-col items-center justify-center gap-3',
    minimal: 'flex items-center gap-2',
    card: 'flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-lg shadow-md border'
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      <Loader2 className={cn('animate-spin text-blue-500', sizeClasses[size])} />

      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">{progress}%</p>
        </div>
      )}

      {text && (
        <p className={cn(
          'animate-pulse',
          variant === 'minimal' ? 'text-sm text-gray-600' : 'text-sm text-gray-600 text-center'
        )}>
          {text}
        </p>
      )}
    </div>
  );
}
