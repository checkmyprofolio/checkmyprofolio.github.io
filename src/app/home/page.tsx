
'use client';
import { HeroSection } from '@/components/sections/hero-section';

import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const NOTIFICATION_KEY = 'desktop-suggestion-shown';

export default function HomePage() {
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const hasBeenShown = sessionStorage.getItem(NOTIFICATION_KEY);

    // isDesktop can be null initially, so we wait until it's a boolean
    if (isDesktop === false && !hasBeenShown) {
      toast({
        title: 'Desktop Recommended',
        description: "The current portfolio layout is optimized for desktop and laptop screens.",
        duration: 8000,
      });
      sessionStorage.setItem(NOTIFICATION_KEY, 'true');
    }
  }, [isDesktop, toast]);


  return (
    <>
      <HeroSection />
    </>
  );
}
