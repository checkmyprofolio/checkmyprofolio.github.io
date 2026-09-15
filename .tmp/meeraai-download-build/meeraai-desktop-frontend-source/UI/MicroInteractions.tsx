import React from 'react';
import { motion } from 'framer-motion';

export const MicroInteractions = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 14px 28px rgba(0, 0, 0, 0.25)" }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 260 }}
    onClick={onClick}
    style={{ display: 'inline-block' }}
  >
    {children}
  </motion.div>
);
