'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeTransition } from '@/hooks/use-theme-transition';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    startTransition(newTheme, () => {
        setTheme(newTheme);
    });
  };

  const iconVariants = {
    hidden: { rotate: -90, scale: 0, opacity: 0 },
    visible: {
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      rotate: 90,
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  if (!mounted) {
    return (
        <Button variant="ghost" size="icon" aria-label="Toggle theme"  className="relative overflow-hidden">
             <div className="h-[1.2rem] w-[1.2rem]"></div>
        </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative overflow-hidden"
    >
      <AnimatePresence initial={false} mode="wait">
        {mounted && theme === 'dark' ? (
          <motion.div
            key="moon"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
