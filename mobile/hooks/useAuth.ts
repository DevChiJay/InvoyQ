import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/auth';
import { userApi } from '@/services/api/user';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { router } from 'expo-router';
import { LoginRequest, RegisterRequest, UserRead, UserUpdate } from '@/types/auth';

export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: userApi.getMe,
    enabled: false, // Manually fetch on app start
    staleTime: 5 * 60 * 1000,
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      // Don't auto-login, user needs to verify email
      router.replace('/(auth)/login');
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await tokenStorage.setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
      router.replace('/(tabs)');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await tokenStorage.removeToken();
      queryClient.clear(); // Clear all cached data
    },
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UserUpdate) => userApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: userApi.uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });

  return {
    user,
    isLoading,
    error,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    uploadLogo: uploadLogoMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  };
}
