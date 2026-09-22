"use client";

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortfolioChat } from '../sections/portfolio-chat';

export function ProfileButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="icon" aria-label="Chat about Vidit and his projects" className="h-10 w-10 rounded-full shadow-lg shadow-primary/20">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="portfolio-chat-overlay fixed inset-0 z-[260] bg-slate-950/25 backdrop-blur-[5px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="portfolio-chat-popup fixed left-1/2 top-1/2 z-[270] flex h-[min(760px,calc(100dvh-2rem))] min-h-[460px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-[min(1180px,calc(100vw-3rem))] max-w-[1180px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white/70 shadow-[0_30px_100px_-20px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[36px] backdrop-saturate-150 outline-none dark:border-white/15 dark:bg-slate-950/65 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none">
          <Dialog.Title className="sr-only">Ask Vidit's portfolio</Dialog.Title>
          <Dialog.Description className="sr-only">Chat about Vidit Shah, his skills, and projects.</Dialog.Description>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(132,204,22,0.08),transparent_50%)]" />
          <div className="relative flex min-h-0 flex-1 flex-col"><PortfolioChat onClose={() => setOpen(false)} /></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
