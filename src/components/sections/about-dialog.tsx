'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { aboutMe, avatarImage, skills } from '@/lib/data';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useRef } from 'react';

type AboutDialogProps = {
  children: React.ReactNode;
};

export function AboutDialog({ children }: AboutDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-3xl sm:text-4xl">About Me</DialogTitle>
            <DialogDescription className="text-center text-lg">{aboutMe.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-8 py-4 md:grid-cols-3">
            <motion.div 
              className="flex flex-col items-center"
              style={{ perspective: '800px' }}
              ref={ref}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                whileHover={{ scale: 1.05, transition: { type: 'spring' } }}
              >
                {avatarImage && (
                  <Image
                    src={avatarImage.imageUrl}
                    alt={avatarImage.description}
                    width={160}
                    height={160}
                    className="rounded-full border-4 border-primary/50"
                    data-ai-hint={avatarImage.imageHint}
                  />
                )}
              </motion.div>
            </motion.div>
            <div className="md:col-span-2">
              <div
                className="text-sm text-muted-foreground sm:text-base"
                dangerouslySetInnerHTML={{ __html: aboutMe.bio }}
              />
            </div>
          </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-4 text-center font-headline text-2xl">My Skills</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {skills.map((skill, i) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <Badge variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}