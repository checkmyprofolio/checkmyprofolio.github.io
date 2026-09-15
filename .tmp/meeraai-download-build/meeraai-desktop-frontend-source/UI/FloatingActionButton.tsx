import React from 'react';
import './neon-button.css';
import { motion } from 'framer-motion';

export const FloatingActionButton = ({ icon, onClick, style }: { icon: React.ReactNode, onClick?: () => void, style?: React.CSSProperties }) => (
  <motion.button
    className="neon-button"
    style={{
      borderRadius: '50%',
      width: '64px',
      height: '64px',
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 10,
      ...style
    }}
    whileHover={{ scale: 1.15, boxShadow: '0 0 48px var(--neon-magenta)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    aria-label="Action"
  >
    {icon}
  </motion.button>
);
