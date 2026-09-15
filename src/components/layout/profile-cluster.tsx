'use client';
import { useEffect, useState } from 'react';
import { ProfileButton } from './profile-button';

export function ProfileCluster() {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-background/80 p-2 pl-4 shadow-lg backdrop-blur-xl">
      {time && (
        <>
          <span className="text-sm font-medium tabular-nums">{time}</span>
          <div className="h-4 w-px bg-border"></div>
        </>
      )}
      <span className="text-sm font-medium">Ask about my work</span>
      <ProfileButton />
    </div>
  );
}
