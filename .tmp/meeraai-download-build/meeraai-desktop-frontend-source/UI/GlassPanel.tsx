import React from 'react';
import './design-system-colors.css';
import { motion } from 'framer-motion';

export const GlassPanel = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <motion.div
    className="glass-panel neon-glow"
    style={style}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, type: 'spring' }}
  >
    {children}
  </motion.div>
);
