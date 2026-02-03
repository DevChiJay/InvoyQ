import { apiClient } from './client';
import { Token } from '@/types/auth';

export interface GoogleAuthRequest {
  id_token: string;
  device_id?: string;
}

export const googleAuthApi = {
  /**
   * Authenticate with Google using ID token from native Google Sign-In
   * @param idToken - The ID token from Google Sign-In
   * @param deviceId - Optional device identifier
   * @returns Authentication tokens
   */
  authenticateWithGoogle: async (idToken: string, deviceId?: string): Promise<Token> => {
    const response = await apiClient.post('/auth/google/mobile', {
      id_token: idToken,
      device_id: deviceId,
    });
    return response.data;
  },
};
