import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, DashboardPreferences, DashboardPreset } from '@/lib/types/dashboard';
import { useAuth } from '@/lib/hooks/use-auth';

const STORAGE_KEY = 'dashboard_preferences';

// Storage utilities for dashboard preferences
const getDashboardStorageKey = (userId: string) => `${STORAGE_KEY}_${userId}`;

const saveDashboardPreferences = (userId: string, preferences: DashboardPreferences) => {
  try {
    const key = getDashboardStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(preferences));
    console.log('Dashboard preferences saved for user:', userId);
  } catch (error) {
    console.error('Failed to save dashboard preferences:', error);
  }
};

const loadDashboardPreferences = (userId: string): DashboardPreferences | null => {
  try {
    const key = getDashboardStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const preferences = JSON.parse(stored);
      console.log('Dashboard preferences loaded for user:', userId);
      return preferences;
    }
  } catch (error) {
    console.error('Failed to load dashboard preferences:', error);
  }
  return null;
};

const clearDashboardPreferences = (userId: string) => {
  try {
    const key = getDashboardStorageKey(userId);
    localStorage.removeItem(key);
    console.log('Dashboard preferences cleared for user:', userId);
  } catch (error) {
    console.error('Failed to clear dashboard preferences:', error);
  }
};

export function useDashboardLayout() {
  const { user } = useAuth();
  const [layout, setLayout] = useState<DashboardLayout[]>([]);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  const loadPreferences = useCallback(() => {
    // Don't wait for user - load immediately
    setIsLoading(false);
    
    if (!user?.id || user.id === 'loading') {
      return;
    }
    
    const preferences = loadDashboardPreferences(user.id);
    if (preferences) {
      setLayout(preferences.layout || []);
      setVisibleWidgets(preferences.visibleWidgets || []);
      setCurrentPreset(preferences.currentPreset);
    }
  }, [user?.id]);

  // Save preferences to localStorage
  const savePreferences = useCallback((
    newLayout?: DashboardLayout[],
    newVisibleWidgets?: string[],
    newPreset?: string
  ) => {
    if (!user?.id) return;

    const preferences: DashboardPreferences = {
      layout: newLayout || layout,
      visibleWidgets: newVisibleWidgets || visibleWidgets,
      currentPreset: newPreset !== undefined ? newPreset : currentPreset,
    };

    saveDashboardPreferences(user.id, preferences);
  }, [user?.id, layout, visibleWidgets, currentPreset]);

  // Update layout
  const updateLayout = useCallback((newLayout: DashboardLayout[]) => {
    setLayout(newLayout);
    savePreferences(newLayout, undefined, undefined);
  }, [savePreferences]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    const newVisibleWidgets = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter(id => id !== widgetId)
      : [...visibleWidgets, widgetId];
    
    setVisibleWidgets(newVisibleWidgets);
    savePreferences(undefined, newVisibleWidgets, undefined);
  }, [visibleWidgets, savePreferences]);

  // Apply preset
  const applyPreset = useCallback((preset: DashboardPreset) => {
    setLayout(preset.layout);
    setVisibleWidgets(preset.visibleWidgets);
    setCurrentPreset(preset.id);
    savePreferences(preset.layout, preset.visibleWidgets, preset.id);
  }, [savePreferences]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    if (!user?.id) return;
    
    setLayout([]);
    setVisibleWidgets([]);
    setCurrentPreset(undefined);
    
    clearDashboardPreferences(user.id);
  }, [user?.id]);

  // Clear preferences on logout
  const clearPreferences = useCallback(() => {
    if (!user?.id) return;
    
    clearDashboardPreferences(user.id);
    setLayout([]);
    setVisibleWidgets([]);
    setCurrentPreset(undefined);
  }, [user?.id]);

  // Load preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    layout,
    visibleWidgets,
    currentPreset,
    isLoading,
    updateLayout,
    toggleWidget,
    applyPreset,
    resetToDefault,
    clearPreferences,
  };
}