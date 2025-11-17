'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibleIconButtonProps extends ButtonProps {
  /**
   * Accessible label for screen readers
   */
  'aria-label': string;
  
  /**
   * Optional description for complex buttons
   */
  'aria-describedby'?: string;
  
  /**
   * Icon component to render
   */
  icon: React.ComponentType<{ className?: string }>;
  
  /**
   * Optional visible text label
   */
  children?: React.ReactNode;
  
  /**
   * Whether to show loading state
   */
  loading?: boolean;
  
  /**
   * Loading text for screen readers
   */
  loadingText?: string;
}

/**
 * Accessible icon button with proper ARIA labels
 * Ensures all icon buttons are accessible to screen readers
 */
export function AccessibleIconButton({
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  icon: Icon,
  children,
  loading = false,
  loadingText = 'Loading...',
  className,
  disabled,
  ...props
}: AccessibleIconButtonProps) {
  const isDisabled = disabled || loading;
  
  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={isDisabled}
      aria-label={loading ? loadingText : ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
    >
      <Icon 
        className={cn(
          "h-4 w-4", 
          children && "mr-2",
          loading && "animate-spin"
        )} 
        aria-hidden="true" 
      />
      {children && <span>{children}</span>}
    </Button>
  );
}