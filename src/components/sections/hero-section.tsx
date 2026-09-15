
'use client';

import { AnimatedDiv } from '../shared/animated-div';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { avatarImage, aboutMe } from '@/lib/data';

export function HeroSection() {

  const headline = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const word = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const avatarAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        delay: 0.2
      }
    },
  };

  return (
    <section id="home" className="relative w-full py-24 sm:py-32 md:py-40">
      <motion.div 
        className="container mx-auto max-w-4xl px-4 text-center"
        initial="hidden"
        animate="visible"
        viewport={{ once: true }}
      >
        {avatarImage && (
          <motion.div variants={avatarAnimation} className="mb-8 flex justify-center">
            <Image
                src={avatarImage.imageUrl}
                alt={avatarImage.description}
                width={128}
                height={128}
                className="rounded-full border-4 border-primary/30 bg-background/50 p-2 shadow-lg backdrop-blur-sm"
                data-ai-hint={avatarImage.imageHint}
                priority
            />
          </motion.div>
        )}
         <motion.h1
            className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            variants={headline}
          >
            {"Robotics & AI".split(" ").map((char, index) => (
              <motion.span key={index} variants={word} className="inline-block">
                {char}&nbsp;
              </motion.span>
            ))}
             <br/>
            <motion.span variants={word} className='underline-gradient inline-block'>Engineer</motion.span>
          </motion.h1>
        <AnimatedDiv delay={0.8}>
          <p className="mt-6 text-sm font-semibold">{aboutMe.name} &middot; CGPA 8.45 / 10</p>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            B.E. Robotics &amp; Automation graduate, GTU, 2026. I build intelligent systems across robotics, AI, computer vision, automation, and software engineering.
          </p>
        </AnimatedDiv>
        <AnimatedDiv delay={1}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild size="lg">
                        <Link href="/contact">
                            Get in Touch <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild size="lg" variant="outline">
                        <Link href="/projects">
                            View My Work
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </AnimatedDiv>
      </motion.div>
    </section>
  );
}
