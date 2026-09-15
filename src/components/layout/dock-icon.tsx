
'use client';
import {
  motion,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DockIconProps = {
  href: string;
  label: string;
  mouseX: MotionValue;
  children: React.ReactNode;
  onClick?: () => void;
};

export function DockIcon({
  href,
  label,
  mouseX,
  children,
  onClick,
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = href !== '#' && (
    pathname === href || pathname.startsWith(`${href}/`) ||
    (href === '/home' && pathname === '/') ||
    (href === '/projects' && pathname.startsWith('/meeraai'))
  );

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeSync = useTransform(distance, [-160, -80, 0, 80, 160], [36, 50, 78, 50, 36]);
  const size = useSpring(sizeSync, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });
  const ySync = useTransform(distance, [-160, -80, 0, 80, 160], [0, -8, -18, -8, 0]);
  const y = useSpring(ySync, {
    mass: 0.12,
    stiffness: 180,
    damping: 16,
  });

  const content = (
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y }}
        className="relative z-10 flex w-9 shrink-0 items-center justify-center"
        onClick={onClick}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex h-full w-full items-center justify-center text-foreground drop-shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition-colors duration-200 group-hover:text-primary">
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
  );

  // If there's no href, it's a button-like element (like About or Logout)
  if (href === '#') {
    return <div className="group">{content}</div>;
  }

  return (
    <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className="group relative flex h-full items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {content}
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-[5px] left-1/2 h-[3px] w-[18px] -translate-x-1/2 rounded-full bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,0.5)] transition-[opacity,transform] duration-300 motion-reduce:transition-none ${active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
    </Link>
  );
}
