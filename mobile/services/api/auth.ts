import { apiClient } from './client';
import { Token, UserRead, LoginRequest, RegisterRequest } from '@/types/auth';
import { tokenStorage } from '@/services/storage/tokenStorage';

export const authApi = {
  register: async (data: RegisterRequest): Promise<UserRead> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<Token> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    // Store both access and refresh tokens and ensure they're fully written
    const tokenData: Token = response.data;
    await tokenStorage.setTokens(tokenData.access_token, tokenData.refresh_token);
    
    // Verify tokens were stored successfully
    const storedToken = await tokenStorage.getToken();
    if (!storedToken) {
      throw new Error('Failed to store authentication token');
    }
    
    return tokenData;
  },

  logout: async (): Promise<void> => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API call fails
      }
    }
    await tokenStorage.removeAllTokens();
  },

  verifyEmail: async (token: string): Promise<{ message: string; email: string }> => {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  googleLogin: async (): Promise<{ auth_url: string }> => {
    const response = await apiClient.get('/auth/google/login');
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },
};
