
'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark';

type ThemeTransitionState = {
  isAnimating: boolean;
  theme: Theme | null;
  startTransition: (newTheme: Theme, onTransitionEnd: () => void) => void;
};

export const useThemeTransition = create<ThemeTransitionState>((set) => ({
  isAnimating: false,
  theme: null,
  startTransition: (newTheme, onTransitionEnd) => {
    set({ isAnimating: true, theme: newTheme });
    
    // Change theme almost immediately to start the slow background transition
    onTransitionEnd();

    // End the animation overlay after it has played
    setTimeout(() => {
      set({ isAnimating: false, theme: null });
    }, 1200); // Should be slightly longer than the animation duration
  },
}));
