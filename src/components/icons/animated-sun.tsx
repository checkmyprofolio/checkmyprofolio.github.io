'use client';
import { motion } from 'framer-motion';

export function AnimatedSunIcon({ className, rotate = 0 }: { className?: string, rotate?: number }) {
  const raysVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: rotate,
      transition: {
        duration: 2.2,
        ease: 'linear',
      },
    },
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.g variants={raysVariants} initial="initial" animate="animate">
        <motion.circle
          cx="12"
          cy="12"
          r="4"
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: [0.9, 1, 0.9], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <g>
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </g>
      </motion.g>
    </svg>
  );
}
