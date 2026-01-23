import type { User } from '@/types/api';

// Token management
export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// User management
export const setUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const clearUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

// Complete logout
export const logout = async () => {
  const refreshToken = getRefreshToken();
  
  // Call logout API if refresh token exists
  if (refreshToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    }
  }
  
  clearTokens();
  clearUser();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Check if user is pro
export const isProUser = (): boolean => {
  const user = getUser();
  return user?.is_pro || false;
};
