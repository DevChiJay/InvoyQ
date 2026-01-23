import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as Device from 'expo-device';
import { API_CONFIG } from '@/constants/config';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { router } from 'expo-router';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const getDeviceId = (): string => {
  return Device.modelName || Device.osName || 'unknown-device';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token and device ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Device-Id'] = getDeviceId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        await tokenStorage.removeAllTokens();
        if (router.canGoBack()) {
          router.replace('/(auth)/login');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh is complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              'X-Device-Id': getDeviceId(),
            }
          }
        );

        const { access_token, refresh_token } = response.data;

        // Store new tokens
        await tokenStorage.setTokens(access_token, refresh_token);

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshError, null);
        await tokenStorage.removeAllTokens();
        
        // Navigate to login if not already there
        if (router.canGoBack()) {
          router.replace('/(auth)/login');
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
