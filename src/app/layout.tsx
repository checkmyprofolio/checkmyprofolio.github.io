

'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { AppShell } from '@/components/layout/app-shell';
import { LiquidBackground } from '@/components/layout/liquid-background';
import { SocialSidebar } from '@/components/layout/social-sidebar';
import { ThemeTransition } from '@/components/theme-transition';



import { CursorAura } from '@/components/shared/cursor-aura';



// export const metadata: Metadata = {
//   title: 'Profolio | Your Professional Portfolio',
//   description: 'A modern, animated portfolio built with Next.js.',
// };

function AppContent({ children }: { children: React.ReactNode }) {
  return <><SocialSidebar /><AppShell>{children}</AppShell></>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Profolio | Your Professional Portfolio</title>
        <meta name="description" content="A modern, animated portfolio built with Next.js." />
        <link rel="icon" href="/checkmyprofolio.github.io/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/checkmyprofolio.github.io/icon.png" />
        <link rel="apple-touch-icon" href="/checkmyprofolio.github.io/apple-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <>
            <CursorAura />
            <ThemeTransition />
            
            <LiquidBackground />
            <AppContent>{children}</AppContent>
            <Toaster />
          </>
        </ThemeProvider>
      </body>
    </html>
  );
}
