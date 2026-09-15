'use client';

import { motion } from 'framer-motion';

type AnimatedDivProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedDiv({ children, className, delay = 0 }: AnimatedDivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
