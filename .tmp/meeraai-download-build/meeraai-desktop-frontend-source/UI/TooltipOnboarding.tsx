import React, { useState } from 'react';

export const TooltipOnboarding = ({ text, children }: { text: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          top: '-2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,40,60,0.9)',
          color: '#d7e7ff',
          borderRadius: '12px',
          padding: '0.5rem 1rem',
          fontFamily: 'var(--font-primary)',
          fontSize: '0.95rem',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
          zIndex: 100,
          opacity: 0.95,
          animation: 'fadeIn 0.3s',
        }}>
          {text}
        </div>
      )}
    </div>
  );
};
