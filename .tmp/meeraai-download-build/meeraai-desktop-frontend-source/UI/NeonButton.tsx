import React from 'react';
import './neon-button.css';

export const NeonButton = ({ children, onClick, style }: { children: React.ReactNode, onClick?: () => void, style?: React.CSSProperties }) => (
  <button className="neon-button" onClick={onClick} style={style}>
    {children}
  </button>
);
