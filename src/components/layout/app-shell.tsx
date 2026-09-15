'use client';

import { useEffect, useState } from 'react';
import { Header } from './header';
import { Logo } from './logo';
import { preloadModel } from '@/lib/portfolio-local-assistant';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Start pre-loading the AI model into VRAM immediately so chat is instant.
    preloadModel();
    const updateScrollState = () => setHasScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 h-28 bg-[linear-gradient(180deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.34)_34%,rgba(2,6,23,0.08)_68%,rgba(2,6,23,0)_100%)] backdrop-blur-[12px] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_20%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_20%,transparent_100%)] transition-opacity duration-700 ease-out ${hasScrolled ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="fixed top-4 left-4 z-50">
        <Logo />
      </div>
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
