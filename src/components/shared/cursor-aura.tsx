'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { useIsDesktop } from '@/hooks/use-is-desktop';

// Type for a single particle
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  opacity: number;
  color: string;
};

// Hook to generate unique IDs
let idCounter = 0;
const useUniqueId = () => ++idCounter;

export function CursorAura() {
  const isDesktop = useIsDesktop();
  const [mousePosition, setMousePosition] = useState({ x: -200, y: -200 });
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleTap = (event: MouseEvent | TouchEvent) => {
        let x, y;
        if ('touches' in event) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }
        createFirecracker(x, y);
    };

    // Attach tap/click listeners for all devices
    window.addEventListener('mousedown', handleTap as (e: Event) => void);
    window.addEventListener('touchstart', handleTap as (e: Event) => void);

    // Attach mouse move listener only for desktop
    if (isDesktop) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      // Clean up all listeners
      window.removeEventListener('mousedown', handleTap as (e: Event) => void);
      window.removeEventListener('touchstart', handleTap as (e: Event) => void);
      if (isDesktop) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isDesktop]);

  const createFirecracker = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 50; // Number of particles in a blast
    const colors = ["hsl(var(--primary))", "hsl(var(--accent))", "#FFFFFF"];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 4 + 2;
      newParticles.push({
        id: useUniqueId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
        setParticles(currentParticles => 
            currentParticles.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                opacity: p.opacity - 0.02, // Fade out
            })).filter(p => p.opacity > 0) // Remove when invisible
        );
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [particles]);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.7 };
  const mouseXSpring = useSpring(mousePosition.x, springConfig);
  const mouseYSpring = useSpring(mousePosition.y, springConfig);
  
  return (
    <>
      {/* Firecracker Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: 'fixed',
              left: p.x,
              top: p.y,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: p.color,
              pointerEvents: 'none',
              zIndex: 9999,
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ x: p.vx * 20, y: p.vy * 20, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Fiery Aura - Desktop only */}
      {isDesktop && (
        <motion.div
            style={{
            position: 'fixed',
            top: 0,
            left: 0,
            translateX: mouseXSpring,
            translateY: mouseYSpring,
            x: '-50%',
            y: '-50%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, hsl(var(--accent) / 0.4) 40%, transparent 70%)',
            filter: 'blur(25px) brightness(1.5)',
            pointerEvents: 'none',
            zIndex: 9998,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
            transition={{
            scale: {
                repeat: Infinity,
                repeatType: 'mirror',
                duration: 2,
                ease: 'easeInOut',
            }
            }}
        />
      )}
    </>
  );
}
