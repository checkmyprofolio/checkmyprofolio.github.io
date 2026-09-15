 'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Code, Home, FolderKanban, Mail, LayoutDashboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ThemeToggle } from '../theme-toggle';
import { AboutDialog } from '../sections/about-dialog';
import { Dock } from './dock';
import { ProfileCluster } from './profile-cluster';
import { ProfileButton } from './profile-button';
const navLinks = [
 { href: '/home', label: 'Home', icon: Home },
 { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
 { href: '/projects', label: 'Projects', icon: FolderKanban },
 { href: '/contact', label: 'Contact', icon: Mail },
];
export function Header() {
 const pathname = usePathname();
 const [open, setOpen] = useState(false);
 return <>
  <div className="fixed right-4 top-4 z-50"><ThemeToggle /></div>
  <header className="fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 lg:flex"><Dock navLinks={navLinks} /></header>
  <div className="fixed bottom-6 right-6 z-50 hidden lg:flex"><ProfileCluster /></div>
  <header className="glass-strong fixed bottom-3 left-1/2 z-50 flex w-[calc(100vw-1rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full px-4 py-2 lg:hidden">
   <span className="text-sm font-semibold">Explore Profolio</span>
   <div className="flex gap-2"><ProfileButton /><Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation"><Menu /></Button></SheetTrigger>
    <SheetContent side="bottom" className="bg-background"><div className="flex items-center justify-between"><SheetTitle>Explore portfolio</SheetTitle><SheetClose asChild><Button variant="ghost" size="icon" aria-label="Close navigation"><X /></Button></SheetClose></div>
     <nav className="mt-4 grid gap-2">{navLinks.map(({href,label,icon:Icon}) => <SheetClose asChild key={href}><Link href={href} aria-current={pathname === href ? 'page' : undefined} className="flex items-center gap-3 rounded-xl p-3 hover:bg-primary/10"><Icon className="h-5 w-5" />{label}</Link></SheetClose>)}</nav>
     <AboutDialog><Button variant="ghost" className="mt-2"><Code className="mr-2 h-5 w-5" />About Vidit</Button></AboutDialog>
    </SheetContent>
   </Sheet></div>
  </header>
 </>;
}
