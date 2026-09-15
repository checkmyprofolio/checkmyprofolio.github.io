import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export const DragDropConversationCard = ({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      className="glass-panel"
      drag
      dragConstraints={{ left: 0, right: window.innerWidth - 320, top: 0, bottom: window.innerHeight - 120 }}
      whileHover={{ y: -2, boxShadow: '0 16px 32px rgba(0, 0, 0, 0.28)' }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: "min(720px, 100%)",
        minHeight: 96,
        borderRadius: "24px",
        margin: "0.8rem auto",
        ...style
      }}
    >
      {children}
    </motion.div>
  );
};
