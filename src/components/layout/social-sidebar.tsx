
'use client';

import { Github, Linkedin, Instagram, Mail } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

const socialLinks = [
  { icon: Github, href: 'https://github.com/viditshah5656', 'aria-label': 'GitHub' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/rockstar5656/', 'aria-label': 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/_mr__shah__007_/', 'aria-label': 'Instagram' },
  { icon: Mail, href: 'mailto:viditshah5656@gmail.com', 'aria-label': 'Email' },
];

const sidebarVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        delay: 0.5,
        staggerChildren: 0.2,
        delayChildren: 0.7,
      },
    },
};

const iconVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
  },
  hover: {
    scale: 1.3,
    rotate: [0, 15, -15, 15, 0],
    transition: { duration: 0.7, type: 'spring', stiffness: 300 },
  },
  tap: { scale: 0.9 },
};


export function SocialSidebar() {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.div 
        className="fixed top-1/2 right-4 z-50 -translate-y-1/2 transform hidden md:block"
        initial="initial"
        animate="animate"
        variants={sidebarVariants}
        whileHover={{
            scale: 1.05,
            transition: { type: 'spring', stiffness: 300 }
        }}
      >
        <motion.div 
            className="flex flex-col gap-2 rounded-full bg-background/30 p-2 shadow-lg backdrop-blur-2xl dark:bg-background/10"
        >
          {socialLinks.map((link, index) => (
            <motion.div 
              key={index} 
              variants={iconVariants}
            >
                <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        variants={iconVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="group"
                    >
                        <Button variant="ghost" size="icon" asChild 
                          className="transition-all duration-300 group-hover:shadow-[0_0_20px_4px] group-hover:shadow-primary/40"
                        >
                          <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={link['aria-label']}
                          >
                              <link.icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                          </a>
                        </Button>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>{link['aria-label']}</p>
                </TooltipContent>
                </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
