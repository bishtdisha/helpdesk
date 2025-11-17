'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { TicketFilters } from '@/lib/types/ticket';

export interface FilterPreset {
  id: string;
  name: string;
  filters: TicketFilters;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'ticket_filter_presets_';

export function useFilterPresets() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage key for current user
  const getStorageKey = useCallback(() => {
    if (!user?.id) return null;
    return `${STORAGE_KEY_PREFIX}${user.id}`;
  }, [user?.id]);

  // Load presets from localStorage
  const loadPresets = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setPresets([]);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as FilterPreset[];
        setPresets(parsed);
      } else {
        setPresets([]);
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((presetsToSave: FilterPreset[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(presetsToSave));
    } catch (error) {
      console.error('Failed to save filter presets:', error);
    }
  }, [getStorageKey]);

  // Load presets on mount and when user changes
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Save a new preset
  const savePreset = useCallback((name: string, filters: TicketFilters): FilterPreset => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);

    return newPreset;
  }, [presets, savePresetsToStorage]);

  // Rename a preset
  const renamePreset = useCallback((presetId: string, newName: string) => {
    const updatedPresets = presets.map(preset =>
      preset.id === presetId ? { ...preset, name: newName } : preset
    );
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
  }, [presets, savePresetsToStorage]);

  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    const updatedPresets = presets.filter(preset => preset.id !== presetId);
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
  }, [presets, savePresetsToStorage]);

  // Get a preset by ID
  const getPreset = useCallback((presetId: string): FilterPreset | undefined => {
    return presets.find(preset => preset.id === presetId);
  }, [presets]);

  // Clear all presets (used on logout)
  const clearPresets = useCallback(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setPresets([]);
    } catch (error) {
      console.error('Failed to clear filter presets:', error);
    }
  }, [getStorageKey]);

  return {
    presets,
    isLoading,
    savePreset,
    renamePreset,
    deletePreset,
    getPreset,
    clearPresets,
  };
}
