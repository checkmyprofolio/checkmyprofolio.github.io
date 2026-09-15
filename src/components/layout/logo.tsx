'use client';
import { Code } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/home" className="flex items-center gap-2 group">
        <Code className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
        <span className="text-xl font-bold tracking-tight text-foreground group-hover:underline-gradient">
            Profolio
        </span>
    </Link>
  );
}
