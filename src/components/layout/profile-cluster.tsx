'use client';
import { useEffect, useState } from 'react';
import { ProfileButton } from './profile-button';

export function ProfileCluster() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }));
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-background/80 p-2 pl-4 shadow-lg backdrop-blur-xl">
      {time && <span className="text-sm font-semibold tabular-nums">{time}</span>}
      {time && <span aria-hidden="true" className="h-5 w-px bg-border/70" />}
      <span className="text-sm font-medium">Ask about my work</span>
      <ProfileButton />
    </div>
  );
}
