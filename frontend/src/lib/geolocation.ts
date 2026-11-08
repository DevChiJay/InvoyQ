'use client';

import { PRO_PRICE_USD, PRO_PRICE_NGN } from '@/constants/plans';

interface GeolocationData {
  country?: string;
  countryCode?: string;
  currency?: string;
}

// Cache for geolocation data to avoid multiple API calls
let cachedGeolocation: GeolocationData | null = null;
let isLoading = false;

export const getGeolocation = async (): Promise<GeolocationData> => {
  // Return cached data if available
  if (cachedGeolocation) {
    return cachedGeolocation;
  }

  // Prevent multiple simultaneous requests
  if (isLoading) {
    return { country: 'US', countryCode: 'US', currency: 'USD' };
  }

  isLoading = true;

  try {
    // Use ipapi.co for geolocation (free tier allows 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch geolocation');
    }

    const data = await response.json();
    
    cachedGeolocation = {
      country: data.country_name,
      countryCode: data.country_code,
      currency: data.currency,
    };

    return cachedGeolocation;
  } catch (error) {
    console.error('Failed to get geolocation:', error);
    
    // Default to US if geolocation fails
    cachedGeolocation = {
      country: 'United States',
      countryCode: 'US', 
      currency: 'USD',
    };

    return cachedGeolocation;
  } finally {
    isLoading = false;
  }
};

export const isNigerianUser = async (): Promise<boolean> => {
  const geo = await getGeolocation();
  return geo.countryCode === 'NG';
};

export const getCurrencyInfo = async () => {
  const isNigerian = await isNigerianUser();
  
  if (isNigerian) {
    return {
      currency: 'NGN',
      symbol: '₦',
      price: PRO_PRICE_NGN,
      period: '/month',
      paymentProviders: ['paystack'],
    };
  }

  return {
    currency: 'USD',
    symbol: '$',
    price: PRO_PRICE_USD,
    period: '/month',
    paymentProviders: ['paystack'],
  };
};

// For testing purposes, you can override the geolocation
export const setTestGeolocation = (data: GeolocationData) => {
  cachedGeolocation = data;
};

// Clear cache (useful for testing or if user changes location)
export const clearGeolocationCache = () => {
  cachedGeolocation = null;
  isLoading = false;
};