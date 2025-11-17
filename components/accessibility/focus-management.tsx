'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

/**
 * Focus trap component for modals and dialogs
 * Traps focus within the component and restores focus when unmounted
 */
export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  initialFocus 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when trap becomes active
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [active]);

  // Focus management
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    
    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');
      
      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    // Set initial focus
    const setInitialFocus = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Set initial focus
    setInitialFocus();

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previously active element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus, initialFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="focus-trap">
      {children}
    </div>
  );
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for managing focus within a component
 */
export function useFocusManagement() {
  const focusFirstElement = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    const firstFocusable = container.querySelector(focusableSelectors) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const focusLastElement = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    const focusableElements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (lastFocusable) {
      lastFocusable.focus();
    }
  }, []);

  const moveFocusToNext = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    // Simulate Tab key press
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      which: 9,
      bubbles: true,
      cancelable: true
    });
    
    activeElement.dispatchEvent(event);
  }, []);

  const moveFocusToPrevious = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    // Simulate Shift+Tab key press
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      which: 9,
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    
    activeElement.dispatchEvent(event);
  }, []);

  return {
    focusFirstElement,
    focusLastElement,
    moveFocusToNext,
    moveFocusToPrevious
  };
}