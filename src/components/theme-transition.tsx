
'use client';

import { useThemeTransition } from '@/hooks/use-theme-transition';
import { AnimatePresence, motion } from 'framer-motion';
import { SpaceAnimation } from './shared/space-animation';
import { AnimatedSunIcon } from './icons/animated-sun';

export function ThemeTransition() {
    const { isAnimating, theme } = useThemeTransition();

    const iconVariants = {
        hidden: (isDarkMode: boolean) => ({ 
            opacity: 0, 
            y: isDarkMode ? -60 : 60, 
            scale: 0.5 
        }),
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
        },
        exit: (isDarkMode: boolean) => ({ 
            opacity: 0, 
            y: isDarkMode ? 60 : -60, 
            scale: 0.5,
            transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
        })
    };

    return (
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    key="theme-transition-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
                    exit={{ opacity: 0, transition: { duration: 1.2, delay: 1.3, ease: 'easeIn' } }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/50 backdrop-blur-sm"
                >
                   <SpaceAnimation theme={theme} />
                   <div className="relative h-28 w-28">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={theme}
                                custom={theme === 'dark'}
                                variants={iconVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <AnimatedSunIcon 
                                    className="h-28 w-28 text-amber-400" 
                                    rotate={theme === 'dark' ? -90 : 90} 
                                />
                            </motion.div>
                        </AnimatePresence>
                   </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

