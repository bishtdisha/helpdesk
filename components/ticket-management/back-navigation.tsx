"use client"

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackNavigationProps {
  /**
   * Optional custom label for the back button
   * If not provided, only the arrow icon will be shown
   */
  label?: string;
  
  /**
   * Optional fallback URL if browser history is empty
   * Defaults to /dashboard with tickets module active
   */
  fallbackUrl?: string;
  
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * BackNavigation Component
 * 
 * Provides a clean, minimal back arrow navigation that uses browser history.
 * This ensures users navigate back to the immediately previous page, not just
 * to a fixed location like the ticket list.
 * 
 * Features:
 * - Uses browser history (router.back())
 * - Minimal, modern design with just an arrow icon
 * - Consistent across all ticket pages
 * - Fallback to dashboard if no history exists
 * 
 * Usage:
 * ```tsx
 * <BackNavigation />
 * ```
 */
export function BackNavigation({ 
  label, 
  fallbackUrl = '/helpdesk/dashboard',
  className = ''
}: BackNavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to dashboard with tickets module active
      router.push(fallbackUrl);
      setTimeout(() => {
        const event = new CustomEvent('setActiveModule', { detail: 'tickets' });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 -ml-2 hover:bg-accent ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}
