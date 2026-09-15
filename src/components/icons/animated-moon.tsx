
'use client';
import { motion } from 'framer-motion';

export function AnimatedMoonIcon({ className, rotate = false }: { className?: string, rotate?: boolean }) {
  const moonVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: rotate ? -360 : 0,
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
      <motion.g variants={moonVariants} initial="initial" animate="animate">
        <motion.path
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.g>
    </svg>
  );
}
