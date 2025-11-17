'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useGlobalKeyboardHandler } from '@/lib/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsContextType {
  // Dialog state
  isNewTicketDialogOpen: boolean;
  setIsNewTicketDialogOpen: (open: boolean) => void;
  
  // Search focus
  searchInputRef: React.RefObject<HTMLInputElement> | null;
  registerSearchInput: (ref: React.RefObject<HTMLInputElement>) => void;
  focusSearch: () => void;
  
  // Priority filter
  priorityFilterRef: React.RefObject<HTMLButtonElement> | null;
  registerPriorityFilter: (ref: React.RefObject<HTMLButtonElement>) => void;
  setPriorityFilter: (priority: string) => void;
  
  // Help dialog
  isHelpDialogOpen: boolean;
  setIsHelpDialogOpen: (open: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<React.RefObject<HTMLInputElement> | null>(null);
  const [priorityFilterRef, setPriorityFilterRef] = useState<React.RefObject<HTMLButtonElement> | null>(null);

  // Initialize global keyboard handler
  useGlobalKeyboardHandler();

  const registerSearchInput = useCallback((ref: React.RefObject<HTMLInputElement>) => {
    setSearchInputRef(ref);
  }, []);

  const registerPriorityFilter = useCallback((ref: React.RefObject<HTMLButtonElement>) => {
    setPriorityFilterRef(ref);
  }, []);

  const focusSearch = useCallback(() => {
    if (searchInputRef?.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [searchInputRef]);

  const setPriorityFilter = useCallback((priority: string) => {
    // This will be implemented by the component that uses it
    console.log('Set priority filter:', priority);
  }, []);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        isNewTicketDialogOpen,
        setIsNewTicketDialogOpen,
        searchInputRef,
        registerSearchInput,
        focusSearch,
        priorityFilterRef,
        registerPriorityFilter,
        setPriorityFilter,
        isHelpDialogOpen,
        setIsHelpDialogOpen,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
}
