import React from 'react';
import { motion } from 'framer-motion';
import './design-system-colors.css';

export const AnimatedGradientBackground = () => (
  <motion.div
    className="animated-gradient-bg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      pointerEvents: 'none',
    }}
  />
);
