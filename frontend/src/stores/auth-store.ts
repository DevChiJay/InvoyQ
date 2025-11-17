import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';
import { authAPI } from '@/lib/api';
import { setTokens, clearTokens, setUser, clearUser, getAccessToken, getUser } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  initializeAuth: () => void;
  
  // OAuth helpers
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      initializeAuth: () => {
        // Check if we have a token in localStorage
        const token = getAccessToken();
        const user = getUser();
        
        if (token && user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: true,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Step 1: Login and get token
          const loginResponse = await authAPI.login(email, password);
          const { access_token } = loginResponse.data;
          
          setTokens(access_token);
          
          // Step 2: Fetch user details with the token
          const userResponse = await authAPI.getCurrentUser();
          const user = userResponse.data;
          
          setUser(user);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            _hasHydrated: true,
          });
        } catch (err) {
          const error = err as { response?: { data?: { detail?: string } } };
          const errorMessage = error.response?.data?.detail || 'Login failed';
          
          // Clear any tokens that might have been set
          clearTokens();
          
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            _hasHydrated: true,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, full_name: string) => {
        set({ isLoading: true, error: null });
        try {
          // Register - backend returns the user object directly
          // Note: User must verify email before they can login
          await authAPI.register(email, password, full_name);
          
          set({
            isLoading: false,
            error: null,
            _hasHydrated: true,
          });
        } catch (err) {
          const error = err as { response?: { data?: { detail?: string } } };
          const errorMessage = error.response?.data?.detail || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            _hasHydrated: true,
          });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        clearUser();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          _hasHydrated: true,
        });
        // Redirect to landing page after logout
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authAPI.getCurrentUser();
          const user = response.data;
          
          setUser(user);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            _hasHydrated: true,
          });
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: true,
          });
          clearTokens();
          clearUser();
        }
      },

      clearError: () => set({ error: null }),
      
      // OAuth helpers for setting user and token directly
      setUser: (user: User) => {
        setUser(user);
        set({
          user,
          isAuthenticated: true,
          _hasHydrated: true,
        });
      },
      
      setToken: (token: string) => {
        setTokens(token);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
