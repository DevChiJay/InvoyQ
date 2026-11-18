import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';
import { logger } from '@/utils/logger';

export const settingsStorage = {
  async getPreferences(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  },

  async setPreferences(preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error setting preferences:', error);
    }
  },

  async hasSeenWelcome(userId: string): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(STORAGE_KEYS.WELCOME_SEEN_PREFIX + userId)) === 'true';
    } catch (error) {
      // If storage fails, don't nag with the welcome on every launch
      logger.error('Error reading welcome flag:', error);
      return true;
    }
  },

  async markWelcomeSeen(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WELCOME_SEEN_PREFIX + userId, 'true');
    } catch (error) {
      logger.error('Error saving welcome flag:', error);
    }
  },

  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    } catch (error) {
      console.error('Error clearing preferences:', error);
    }
  },
};
