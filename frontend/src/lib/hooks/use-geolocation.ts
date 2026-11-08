'use client';

import { useState, useEffect } from 'react';
import { getCurrencyInfo, isNigerianUser } from '@/lib/geolocation';
import { PRO_PRICE_USD } from '@/constants/plans';

interface CurrencyInfo {
  currency: 'USD' | 'NGN';
  symbol: string;
  price: number;
  period: string;
  paymentProviders: 'paystack'[];
}

export const useGeolocation = () => {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>({
    currency: 'USD',
    symbol: '$',
    price: PRO_PRICE_USD,
    period: '/month',
    paymentProviders: ['paystack'],
  });
  const [isNigerian, setIsNigerian] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeolocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [currencyData, nigerianCheck] = await Promise.all([
          getCurrencyInfo(),
          isNigerianUser(),
        ]);

        setCurrencyInfo(currencyData as CurrencyInfo);
        setIsNigerian(nigerianCheck);
      } catch (err) {
        console.error('Failed to fetch geolocation:', err);
        setError('Failed to determine location');
        
        // Default to USD if there's an error
        setCurrencyInfo({
          currency: 'USD',
          symbol: '$',
          price: PRO_PRICE_USD,
          period: '/month',
          paymentProviders: ['paystack'],
        });
        setIsNigerian(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeolocation();
  }, []);

  return {
    currencyInfo,
    isNigerian,
    isLoading,
    error,
  };
};