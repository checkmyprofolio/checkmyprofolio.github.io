import React from "react";
import { motion } from "framer-motion";

export const AnimatedBubble = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <motion.div
    className="glass-panel"
    style={{
      border: `1px solid ${color || "var(--copilot-border)"}`,
      borderRadius: "22px",
      padding: "0.9rem 1.1rem",
      margin: "0.4rem 0",
      background: "rgba(18, 26, 42, 0.75)",
      boxShadow: "0 14px 26px rgba(0, 0, 0, 0.32)",
      minWidth: "120px",
      minHeight: "44px",
      display: "inline-block",
      fontFamily: "var(--font-futuristic)",
      fontSize: "0.95rem",
      color: "var(--copilot-text)",
      position: "relative",
    }}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);
