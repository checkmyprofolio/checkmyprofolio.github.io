
'use client';

import { useState, useEffect } from 'react';

// This hook checks for hover capabilities and screen size to determine if it's a desktop environment.
// It returns `null` initially to prevent hydration mismatches.
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    // Media query to check for hover capabilities and a minimum width.
    // This is more reliable than just checking for screen width.
    const mediaQuery = window.matchMedia('(hover: hover) and (min-width: 1024px)');
    
    const updateTarget = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    
    // Set the initial value
    setIsDesktop(mediaQuery.matches);
    
    // Add event listener for changes
    mediaQuery.addEventListener('change', updateTarget);

    // Cleanup the event listener on component unmount
    return () => mediaQuery.removeEventListener('change', updateTarget);
  }, []);

  return isDesktop;
}
