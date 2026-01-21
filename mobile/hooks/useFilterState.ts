import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FilterState {
  searchQuery?: string;
  selectedFilter?: string;
  selectedStatus?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

const FILTER_STORAGE_KEY = 'app_filter_state';

/**
 * Hook to persist and restore filter state for list screens
 * @param screenKey - Unique identifier for the screen (e.g., 'clients', 'products')
 */
export function useFilterState(screenKey: string) {
  const [filterState, setFilterState] = useState<FilterState>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load filter state from storage on mount
  useEffect(() => {
    loadFilterState();
  }, [screenKey]);

  const loadFilterState = async () => {
    try {
      const storedState = await AsyncStorage.getItem(`${FILTER_STORAGE_KEY}_${screenKey}`);
      if (storedState) {
        setFilterState(JSON.parse(storedState));
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load filter state:', error);
      setIsLoaded(true);
    }
  };

  const saveFilterState = async (newState: FilterState) => {
    try {
      await AsyncStorage.setItem(`${FILTER_STORAGE_KEY}_${screenKey}`, JSON.stringify(newState));
      setFilterState(newState);
    } catch (error) {
      console.error('Failed to save filter state:', error);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newState = { ...filterState, [key]: value };
    saveFilterState(newState);
  };

  const clearFilters = async () => {
    try {
      await AsyncStorage.removeItem(`${FILTER_STORAGE_KEY}_${screenKey}`);
      setFilterState({});
    } catch (error) {
      console.error('Failed to clear filter state:', error);
    }
  };

  // Clear all filter states (useful on logout)
  const clearAllFilters = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filterKeys = keys.filter((key) => key.startsWith(FILTER_STORAGE_KEY));
      await AsyncStorage.multiRemove(filterKeys);
    } catch (error) {
      console.error('Failed to clear all filter states:', error);
    }
  };

  return {
    filterState,
    isLoaded,
    updateFilter,
    clearFilters,
    clearAllFilters,
  };
}
