'use client';
import { HeroSection } from '@/components/sections/hero-section';
import { PortfolioAssistantV2 } from '@/components/portfolio-assistant-v2';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const NOTIFICATION_KEY = 'desktop-suggestion-shown';

export default function HomePage() {
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const hasBeenShown = sessionStorage.getItem(NOTIFICATION_KEY);
    if (isDesktop === false && !hasBeenShown) {
      toast({
        title: 'Desktop Recommended',
        description: 'The current portfolio layout is optimized for desktop and laptop screens.',
        duration: 8000,
      });
      sessionStorage.setItem(NOTIFICATION_KEY, 'true');
    }
  }, [isDesktop, toast]);

  return (
    <>
      <HeroSection />
      <PortfolioAssistantV2 />
    </>
  );
}
