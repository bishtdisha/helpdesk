'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category?: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

/**
 * Keyboard shortcut registry
 */
class ShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();

  /**
   * Generate a unique key for a shortcut
   */
  private getShortcutKey(shortcut: Omit<KeyboardShortcut, 'handler' | 'description' | 'category' | 'preventDefault'>): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.meta) parts.push('meta');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): () => void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);

    // Return unregister function
    return () => {
      this.shortcuts.delete(key);
    };
  }

  /**
   * Find a matching shortcut for a keyboard event
   */
  findShortcut(event: KeyboardEvent): KeyboardShortcut | undefined {
    const key = this.getShortcutKey({
      key: event.key,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
    });

    return this.shortcuts.get(key);
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts grouped by category
   */
  getByCategory(): Record<string, KeyboardShortcut[]> {
    const shortcuts = this.getAll();
    const grouped: Record<string, KeyboardShortcut[]> = {};

    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shortcut);
    });

    return grouped;
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts.clear();
  }
}

// Global registry instance
const globalRegistry = new ShortcutRegistry();

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabledRef.current) return;

    // Register all shortcuts
    const unregisterFns = shortcutsRef.current.map((shortcut) =>
      globalRegistry.register(shortcut)
    );

    // Cleanup: unregister all shortcuts
    return () => {
      unregisterFns.forEach((unregister) => unregister());
    };
  }, []);
}

/**
 * Hook to get all registered shortcuts
 */
export function useShortcutRegistry() {
  return {
    getAll: useCallback(() => globalRegistry.getAll(), []),
    getByCategory: useCallback(() => globalRegistry.getByCategory(), []),
  };
}

/**
 * Global keyboard event handler
 */
export function useGlobalKeyboardHandler() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Allow '/' shortcut even in input fields (to focus search)
      // Allow 'Escape' even in input fields (to close dialogs)
      const allowedInInputs = ['/', 'Escape'];
      
      if (isInputField && !allowedInInputs.includes(event.key)) {
        return;
      }

      // Find matching shortcut
      const shortcut = globalRegistry.findShortcut(event);

      if (shortcut) {
        // Prevent default browser behavior if specified
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        // Execute handler
        shortcut.handler(event);
      }
    };

    // Add global event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

/**
 * Utility function to format shortcut key for display
 */
export function formatShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  // Use Cmd on Mac, Ctrl on Windows/Linux
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.ctrl && !isMac) parts.push('Ctrl');
  if (shortcut.meta && isMac) parts.push('⌘');
  if (shortcut.meta && !isMac) parts.push('Win');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  
  // Format key
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();
  
  parts.push(key);
  
  return parts.join(' + ');
}
