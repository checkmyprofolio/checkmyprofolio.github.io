'use client';

import { useState } from 'react';

type LocationData = {
  city: string;
  country: string;
};

type GeolocationState = {
  loading: boolean;
  location: LocationData | null;
  error: string | null;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    location: null,
    error: null,
  });

  const requestLocation = () => {
    setState({ loading: true, location: null, error: null });

    if (!navigator.geolocation) {
      setState({
        loading: false,
        location: null,
        error: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const searchParams = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: 'jsonv2',
            addressdetails: '1',
            'accept-language': 'en',
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`);
          const data = await response.json();
          
          const payload = {
            city: data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || data?.address?.state || 'Unknown',
            country: data?.address?.country || 'Unknown',
            error: null
          };

          if (!response.ok) {
            throw new Error(payload?.error || 'Failed to determine your location.');
          }

          if (!payload?.city || !payload?.country) {
            throw new Error('Could not determine location from coordinates.');
          }

          setState({
            loading: false,
            location: {
              city: payload.city,
              country: payload.country,
            },
            error: null,
          });
        } catch (error: any) {
          setState({
            loading: false,
            location: null,
            error: error.message || 'Failed to determine your location.',
          });
        }
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setState({ loading: false, location: null, error: errorMessage });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return { ...state, requestLocation };
}
