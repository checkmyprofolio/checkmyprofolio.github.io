'use client';

import { motion, useMotionValue } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Code } from 'lucide-react';

import { AboutDialog } from '../sections/about-dialog';

import { DockIcon } from './dock-icon';

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type DockProps = {
  navLinks: NavLink[];
};

export function Dock({ navLinks }: DockProps) {
  const mouseX = useMotionValue(Infinity);



  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="glass-strong relative mx-auto isolate overflow-visible rounded-full border border-white/18 bg-white/18 shadow-[0_18px_44px_-24px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-slate-950/18 dark:shadow-[0_24px_50px_-28px_rgba(2,6,23,0.9)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-white/72 shadow-[0_10px_18px_-6px_rgba(15,23,42,0.24),0_18px_34px_-20px_rgba(15,23,42,0.22)] dark:bg-slate-950/62 dark:shadow-[0_12px_22px_-8px_rgba(2,6,23,0.88),0_20px_40px_-24px_rgba(2,6,23,0.82)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-white/28 dark:bg-slate-950/30" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0.34)_34%,rgba(226,232,240,0.56)_72%,rgba(148,163,184,0.34))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.018)_32%,rgba(15,23,42,0.1)_72%,rgba(2,6,23,0.18))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),transparent_52%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%)]" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_12px_20px_rgba(255,255,255,0.22),inset_0_-10px_22px_rgba(148,163,184,0.12)] dark:shadow-[inset_0_12px_22px_rgba(255,255,255,0.04),inset_0_-14px_28px_rgba(2,6,23,0.24)]" />
      </div>

      <div className="relative z-10 flex h-[4rem] items-center gap-2.5 px-4">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <DockIcon key={href} mouseX={mouseX} href={href} label={label}>
            <Icon className="h-full w-full" />
          </DockIcon>
        ))}

        <div className="relative z-10 h-9 w-[1.5px] rounded-full bg-slate-800/45 shadow-[0_0_0_1px_rgba(255,255,255,0.18)] dark:w-px dark:bg-white/10 dark:shadow-none" />

        <AboutDialog>
          <DockIcon mouseX={mouseX} href="#" label="About">
            <Code className="h-full w-full" />
          </DockIcon>
        </AboutDialog>


      </div>
    </motion.div>
  );
}
