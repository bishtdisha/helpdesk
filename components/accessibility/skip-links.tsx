'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinksProps {
  className?: string;
}

/**
 * Skip links component for keyboard navigation accessibility
 * Provides quick navigation to main content areas
 */
export function SkipLinks({ className }: SkipLinksProps) {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        Skip to navigation
      </a>
      <a
        href="#search"
        className="absolute top-4 left-60 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        Skip to search
      </a>
    </div>
  );
}