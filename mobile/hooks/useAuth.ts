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

  // Get current user - only fetch if we have a token
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: async () => {
      const hasToken = await tokenStorage.hasToken();
      if (!hasToken) {
        return null;
      }
      return userApi.getMe();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user function for manual refresh
  const fetchUser = async () => {
    await refetch();
  };

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // Tokens are already stored in authApi.login
      // Wait a brief moment to ensure tokens are fully written to SecureStore
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate and refetch current user
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
      await queryClient.refetchQueries({ queryKey: AUTH_KEYS.currentUser });
      
      router.replace('/(tabs)');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authApi.logout(); // This will call the API and remove tokens
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
    fetchUser,
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
