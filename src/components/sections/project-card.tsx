
'use client';

import Image from 'next/image';
import { Github, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useRouter } from 'next/navigation';

type Project = {
  id: number;
  title: string;
  description: string;
  image?: ImagePlaceholder;
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
  internalHref?: string;

  ctaLabel?: string;
};

type ProjectCardProps = {
  project: Project;
};

type ProjectCardVariantProps = ProjectCardProps & {
  isInternalProject: boolean;
  onOpenInternalProject: () => void;
};

function ProjectActions({ project, isInternalProject, onOpenInternalProject }: ProjectCardVariantProps) {
  return (
    <CardFooter className="flex justify-end gap-2">
      {project.githubUrl ? (
        <Button variant="ghost" size="sm" asChild>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            <Github className="h-4 w-4 mr-2" />
            {project.githubUrl !== '#' ? 'GitHub' : 'Source'}
          </a>
        </Button>
      ) : null}
      {isInternalProject ? (
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onOpenInternalProject();
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {project.ctaLabel || 'Open Project'}
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Live Demo
          </a>
        </Button>
      )}
    </CardFooter>
  );
}

function FlippingProjectCard({ project, isInternalProject, onOpenInternalProject }: ProjectCardVariantProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const cardVariants = {
        flipped: { rotateY: 180 },
        unflipped: { rotateY: 0 },
    };

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInternalProject) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenInternalProject();
      }
    };
    
    return (
        <div 
            className={`group h-[480px] w-full [perspective:1000px] ${isInternalProject ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onClick={isInternalProject ? onOpenInternalProject : undefined}
            onKeyDown={handleCardKeyDown}
            role={isInternalProject ? 'link' : undefined}
            tabIndex={isInternalProject ? 0 : undefined}
            aria-label={isInternalProject ? `Open ${project.title}` : undefined}
        >
            <motion.div
                className="relative h-full w-full rounded-lg shadow-lg [transform-style:preserve-3d]"
                variants={cardVariants}
                animate={isFlipped ? 'flipped' : 'unflipped'}
                transition={{ duration: 0.6, type: 'spring' }}
            >
                {/* Front Face */}
                <div className="absolute h-full w-full rounded-lg [backface-visibility:hidden]">
                    {project.image && (
                        <Image
                            src={project.image.imageUrl}
                            alt={project.image.description}
                            fill
                            className="rounded-lg object-cover"
                            data-ai-hint={project.image.imageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <h3 className="text-2xl font-bold text-white text-center p-4">{project.title}</h3>
                    </div>
                </div>

                {/* Back Face */}
                <div className="absolute h-full w-full rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <Card className="flex h-full flex-col overflow-hidden">
                        {project.image && (
                            <Image
                                src={project.image.imageUrl}
                                alt={project.image.description}
                                fill
                                className="object-cover filter blur-2xl opacity-40"
                            />
                        )}
                        <div className="relative z-10 flex h-full flex-col bg-card/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="font-headline">{project.title}</CardTitle>
                                <CardDescription className="text-foreground/80">{project.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                    ))}
                                </div>
                            </CardContent>
                            <ProjectActions
                              project={project}
                              isInternalProject={isInternalProject}
                              onOpenInternalProject={onOpenInternalProject}
                            />
                        </div>
                    </Card>
                </div>
            </motion.div>
        </div>
    )
}

function StaticProjectCard({ project, isInternalProject, onOpenInternalProject }: ProjectCardVariantProps) {
    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInternalProject) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpenInternalProject();
      }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -5, transition: { type: 'spring' } }}
            className={isInternalProject ? 'cursor-pointer' : undefined}
            onClick={isInternalProject ? onOpenInternalProject : undefined}
            onKeyDown={handleCardKeyDown}
            role={isInternalProject ? 'link' : undefined}
            tabIndex={isInternalProject ? 0 : undefined}
            aria-label={isInternalProject ? `Open ${project.title}` : undefined}
        >
            <Card className="h-[480px] overflow-hidden flex flex-col">
                {project.image && (
                    <div className="relative h-48 w-full flex-shrink-0">
                        <Image
                            src={project.image.imageUrl}
                            alt={project.image.description}
                            fill
                            className="object-cover"
                            data-ai-hint={project.image.imageHint}
                        />
                    </div>
                )}
                <div className="flex flex-col flex-grow">
                     <CardHeader>
                        <CardTitle className="font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                    <ProjectActions
                      project={project}
                      isInternalProject={isInternalProject}
                      onOpenInternalProject={onOpenInternalProject}
                    />
                </div>
            </Card>
        </motion.div>
    );
}


export function ProjectCard({ project }: ProjectCardProps) {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const isInternalProject = Boolean(project.internalHref);

  const handleOpenInternalProject = () => {
    if (!project.internalHref) {
      return;
    }



    router.push(project.internalHref);
  };

  if (isDesktop === null) {
    return <div className="h-[480px] w-full rounded-lg shadow-lg bg-card/10 animate-pulse"></div>;
  }
  
  return isDesktop ? (
    <FlippingProjectCard
      project={project}
      isInternalProject={isInternalProject}
      onOpenInternalProject={handleOpenInternalProject}
    />
  ) : (
    <StaticProjectCard
      project={project}
      isInternalProject={isInternalProject}
      onOpenInternalProject={handleOpenInternalProject}
    />
  );
}
