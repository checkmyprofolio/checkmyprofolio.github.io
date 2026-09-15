import React from 'react';
import { motion } from 'framer-motion';

export const TypingAnimation = () => (
  <motion.div
    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.span
      style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }}
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 0.7 }}
    />
    <motion.span
      style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-magenta)', boxShadow: '0 0 8px var(--neon-magenta)' }}
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
    />
    <motion.span
      style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-yellow)', boxShadow: '0 0 8px var(--neon-yellow)' }}
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 0.7, delay: 0.4 }}
    />
    <motion.span
      style={{ width: 16, height: 4, borderRadius: '2px', background: '#fff', marginLeft: 8, boxShadow: '0 0 8px #fff' }}
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
  </motion.div>
);
