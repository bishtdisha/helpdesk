// Dashboard storage utilities for managing user-specific preferences

const STORAGE_KEY = 'dashboard_preferences';

export interface StoredDashboardPreferences {
  layout: any[];
  visibleWidgets: string[];
  currentPreset?: string;
  lastUpdated: string;
  version: string;
}

// Get storage key for specific user
export const getDashboardStorageKey = (userId: string): string => {
  return `${STORAGE_KEY}_${userId}`;
};

// Save dashboard preferences for a user
export const saveDashboardPreferences = (
  userId: string, 
  preferences: Omit<StoredDashboardPreferences, 'lastUpdated' | 'version'>
): boolean => {
  try {
    const key = getDashboardStorageKey(userId);
    const dataToStore: StoredDashboardPreferences = {
      ...preferences,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
    };
    
    localStorage.setItem(key, JSON.stringify(dataToStore));
    return true;
  } catch (error) {
    console.error('Failed to save dashboard preferences:', error);
    return false;
  }
};

// Load dashboard preferences for a user
export const loadDashboardPreferences = (userId: string): StoredDashboardPreferences | null => {
  try {
    const key = getDashboardStorageKey(userId);
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const preferences = JSON.parse(stored);
      
      // Validate the structure
      if (preferences && typeof preferences === 'object' && preferences.version) {
        return preferences;
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard preferences:', error);
  }
  
  return null;
};

// Clear dashboard preferences for a user
export const clearDashboardPreferences = (userId: string): boolean => {
  try {
    const key = getDashboardStorageKey(userId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to clear dashboard preferences:', error);
    return false;
  }
};

// Clear all dashboard preferences (useful for cleanup)
export const clearAllDashboardPreferences = (): boolean => {
  try {
    const keys = Object.keys(localStorage);
    const dashboardKeys = keys.filter(key => key.startsWith(STORAGE_KEY));
    
    dashboardKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to clear all dashboard preferences:', error);
    return false;
  }
};

// Get all users with saved preferences (for admin purposes)
export const getUsersWithSavedPreferences = (): string[] => {
  try {
    const keys = Object.keys(localStorage);
    const dashboardKeys = keys.filter(key => key.startsWith(STORAGE_KEY));
    
    return dashboardKeys.map(key => key.replace(`${STORAGE_KEY}_`, ''));
  } catch (error) {
    console.error('Failed to get users with saved preferences:', error);
    return [];
  }
};

// Migrate old preferences format (if needed)
export const migrateDashboardPreferences = (userId: string): boolean => {
  try {
    const oldKey = STORAGE_KEY; // Old format without user ID
    const newKey = getDashboardStorageKey(userId);
    
    // Check if old format exists and new format doesn't
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);
    
    if (oldData && !newData) {
      const parsed = JSON.parse(oldData);
      const migrated: StoredDashboardPreferences = {
        layout: parsed.layout || [],
        visibleWidgets: parsed.visibleWidgets || [],
        currentPreset: parsed.currentPreset,
        lastUpdated: new Date().toISOString(),
        version: '1.0',
      };
      
      localStorage.setItem(newKey, JSON.stringify(migrated));
      localStorage.removeItem(oldKey);
      
      console.log('Dashboard preferences migrated for user:', userId);
      return true;
    }
  } catch (error) {
    console.error('Failed to migrate dashboard preferences:', error);
  }
  
  return false;
};