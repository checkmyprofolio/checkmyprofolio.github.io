
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

// Helper function to get a random value in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Particle class for stars
class Particle {
  x: number;
  y: number;
  z: number;
  xProjected: number;
  yProjected: number;
  scaleProjected: number;
  size: number;
  color: string;

  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    private theme: 'light' | 'dark' | undefined | null
  ) {
    this.x = random(-canvasWidth, canvasWidth);
    this.y = random(-canvasHeight, canvasHeight);
    this.z = random(0, canvasWidth);
    this.xProjected = 0;
    this.yProjected = 0;
    this.scaleProjected = 0;

    this.size = random(0.5, 2.5);
    
    if (this.theme === 'light') {
        // Cool dark star colors for light mode
        const hue = random(200, 260);
        const saturation = random(80, 100);
        const lightness = random(10, 30); // Low lightness for dark stars
        this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${random(0.7, 1)})`;
    } else {
        // Cool light star colors for dark mode
        const hue = random(200, 260); 
        const saturation = random(80, 100);
        const lightness = random(80, 95); // High lightness for light stars
        this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${random(0.5, 1)})`;
    }
  }

  // Project the 3D position to 2D
  project(cameraZ: number, fov: number) {
    this.scaleProjected = fov / (fov + this.z - cameraZ);
    this.xProjected = this.x * this.scaleProjected + this.canvasWidth / 2;
    this.yProjected = this.y * this.scaleProjected + this.canvasHeight / 2;
  }

  // Draw the particle
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.xProjected, this.yProjected);
    ctx.scale(this.scaleProjected, this.scaleProjected);
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export function SpaceAnimation({ theme }: { theme: 'light' | 'dark' | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const fov = 300;
    let particles: Particle[] = [];
    
    const createParticles = () => {
      particles = [];
      const numParticles = 1500;
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(canvas.width, canvas.height, theme));
      }
    };
    
    let cameraZ = -fov;
    const speed = 1;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      cameraZ += speed;
      
      particles.sort((a, b) => b.z - a.z);
      
      particles.forEach(p => {
        if ((p.z - cameraZ) < 1) {
          p.z = cameraZ + canvas.width;
        }
        p.project(cameraZ, fov);
        p.draw(ctx);
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      setup();
      createParticles();
    };

    setup();
    createParticles();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[999] h-full w-full filter blur-[1px]" />;
}
