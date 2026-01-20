import { apiClient } from './client';
import { Token, UserRead, LoginRequest, RegisterRequest } from '@/types/auth';

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
    return response.data;
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
