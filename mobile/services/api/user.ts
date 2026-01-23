import { apiClient } from './client';
import { UserRead, UserUpdate } from '@/types/auth';

export const userApi = {
  getMe: async (): Promise<UserRead> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  updateMe: async (data: UserUpdate): Promise<UserRead> => {
    const response = await apiClient.patch('/me', data);
    return response.data;
  },

  uploadAvatar: async (file: FormData): Promise<{ url: string }> => {
    const response = await apiClient.post('/upload-avatar', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadLogo: async (file: FormData): Promise<{ url: string }> => {
    const response = await apiClient.post('/upload-logo', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/me');
  },
};
