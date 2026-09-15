import React from 'react';
import { motion } from 'framer-motion';

export const VoiceVisualization = ({ listening }: { listening: boolean }) => (
  <motion.div
    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: listening ? 1 : 0.5 }}
    transition={{ duration: 0.3 }}
  >
    {[0, 1, 2, 3, 4].map(i => (
      <motion.div
        key={i}
        style={{ width: 8, height: 8 + Math.random() * 16, borderRadius: '50%', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)' }}
        animate={{ height: listening ? [8, 24, 8] : 8 }}
        transition={{ repeat: Infinity, duration: 1 + i * 0.1 }}
      />
    ))}
  </motion.div>
);
