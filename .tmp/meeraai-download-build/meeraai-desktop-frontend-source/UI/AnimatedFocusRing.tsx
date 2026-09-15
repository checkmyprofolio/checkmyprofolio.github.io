import React from 'react';

export const AnimatedFocusRing = ({ focused }: { focused: boolean }) => (
  <div
    style={{
      outline: focused ? '2px solid rgba(76, 194, 255, 0.6)' : 'none',
      borderRadius: '24px',
      boxShadow: focused ? '0 0 20px rgba(76, 194, 255, 0.35)' : 'none',
      transition: 'outline 0.3s, box-shadow 0.3s',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 100,
    }}
  />
);
