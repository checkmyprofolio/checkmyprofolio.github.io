
'use client';

import { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Loader2, Thermometer, MapPin, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type WeatherData = {
  temp_C: string;
  weatherDesc: { value: string }[];
};

export function TimeAndWeather() {
  const { location, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      const fetchWeather = async () => {
        setWeatherLoading(true);
        setWeatherError(null);
        try {
          const response = await fetch(`https://wttr.in/${location.city}?format=j1`);
          if (!response.ok) {
            throw new Error('Weather data not available for this location.');
          }
          const data = await response.json();
          setWeather(data.current_condition[0]);
        } catch (err: any) {
          setWeatherError(err.message || 'Failed to fetch weather.');
        } finally {
          setWeatherLoading(false);
        }
      };
      fetchWeather();
    }
  }, [location]);

  const handleRequest = () => {
    if (!hasRequested) {
      requestLocation();
      setHasRequested(true);
    }
  };

  const isLoading = locationLoading || weatherLoading;

  const renderContent = () => {
    if (!hasRequested) {
      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={handleRequest} className="flex items-center gap-2 p-2">
                        <MapPin className="h-5 w-5" />
                        <span className="text-sm">Get Info</span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Click to get your local time & weather</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
    }

    if (isLoading) {
      return <div className="flex items-center justify-center p-3 gap-2"><Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading...</span></div>;
    }

    if (locationError) {
      return (
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-3 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">Location Error</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{locationError}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      )
    }

    if (location) {
      return (
        <div className="flex items-center gap-3 px-2 text-sm">
            <div className='flex items-center gap-2'>
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{time}</span>
            </div>

            <div className="h-6 w-px bg-border"></div>

            {weatherError ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Weather
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{weatherError}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : weather ? (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2">
                             <Thermometer className="h-4 w-4 text-primary" />
                            <span>{weather.temp_C}°C</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{location.city}, {location.country}</p>
                            <p>{weather.weatherDesc[0].value}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : null}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex items-center justify-center transition-all duration-300">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? 'loading' : hasRequested ? 'data' : 'initial'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
