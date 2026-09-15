'use client';

import { MeeraImage as Image } from '@/components/shared/meera-image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, Github, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { projects, type Project } from '@/lib/data';
import { featuredSystems } from '@/lib/engineering-profile';
import { meeraModels, meeraSummary, meeraCapabilities } from '@/lib/meeraai-content';
import { AnimatedDiv } from '../shared/animated-div';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

function hasExternalLink(url?: string) {
  return Boolean(url && url !== '#');
}

function isProjectLive(project: Project) {
  return Boolean(project.internalHref || hasExternalLink(project.liveUrl));
}

type ComingSoonState = {
  action: 'project' | 'source';
  project: Project;
} | null;

export function ProjectsSection() {
  const router = useRouter();
  const [comingSoonState, setComingSoonState] = useState<ComingSoonState>(null);

  const handleProjectOpen = (project: Project) => {
    if (project.internalHref) {


      router.push(project.internalHref);
      return;
    }

    if (hasExternalLink(project.liveUrl)) {
      window.open(project.liveUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setComingSoonState({ action: 'project', project });
  };

  const handleSourceOpen = (project: Project) => {
    if (hasExternalLink(project.githubUrl)) {
      window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setComingSoonState({ action: 'source', project });
  };

  const selectedSystem = comingSoonState ? featuredSystems.filter(s => s.level !== 'Current exploration')[comingSoonState.project.id - 1] : null;

  return (
    <>
      <section id="projects" className="relative overflow-hidden py-24 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_20%),radial-gradient(circle_at_84%_12%,rgba(16,185,129,0.08),transparent_18%),linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.58)_24%,rgba(2,6,23,0.9)_100%)]" />
          <div className="absolute left-[10%] top-24 h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute right-[12%] top-40 h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-[30rem] -translate-x-1/2 rounded-full bg-fuchsia-500/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
          <AnimatedDiv className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-sky-200/80">
              <Sparkles className="h-4 w-4" />
              Projects
            </div>
            <h2 className="mt-6 font-headline text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Project Index
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Local AI, software systems, and API experimentation. Each project describes its implementation and the evidence available for it.
            </p>
          </AnimatedDiv>

          <div className="mt-14 grid auto-rows-fr gap-6 lg:grid-cols-2">
            {projects.map((project, index) => {
              const live = isProjectLive(project);

              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group relative min-h-[30rem] overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/70"
                  style={{ boxShadow: `0 36px 110px -70px ${project.glow}` }}
                >
                  <div className="absolute inset-0 opacity-95" style={{ backgroundImage: project.backdrop }} />
                  {project.image ? (
                    <>
                      <Image
                        src={project.image.imageUrl}
                        alt={project.image.description}
                        fill
                        className="scale-[1.12] object-cover blur-[24px] saturate-[1.12] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:blur-[28px]"
                        sizes="(max-width: 1023px) 100vw, 50vw"
                        priority={index < 2}
                        data-ai-hint={project.image.imageHint}
                      />
                      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[8px]" />
                    </>
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.14),rgba(2,6,23,0.4)_42%,rgba(2,6,23,0.9))]" />
                  <div
                    className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at top, ${project.glow}, transparent 34%)` }}
                  />
                  <div className="absolute inset-0 rounded-[inherit] border border-white/8" />

                  <div className="relative p-4 sm:p-5">
                    <div className="flex h-full min-h-[calc(30rem-2rem)] flex-col justify-between rounded-[1.65rem] border border-white/10 bg-slate-950/28 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px] sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-slate-100 backdrop-blur-xl">
                          {project.eyebrow}
                        </div>
                        <div className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-100 backdrop-blur-xl">
                          {project.status}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="max-w-xl">
                          <h3 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">
                            {project.title}
                          </h3>
                          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200/92 sm:text-[0.98rem]">
                            {project.description}
                          </p>
                          {project.internalHref === '/meeraai' && <details className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-400/[0.05] text-sm text-slate-200">
                            <summary className="cursor-pointer rounded-2xl px-4 py-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Current models, browser, and tested workflows</summary>
                            <div className="space-y-5 px-4 pb-5 leading-7">
                              <p>{meeraSummary.approach}</p>
                              <div><h4 className="font-semibold text-white">The seven local profiles</h4><ul className="mt-2 space-y-2">
                                {meeraModels.map(model=><li key={model.id}><strong>{model.name}</strong>: {model.model} / {model.parameters} / {model.quantization}{model.studioAlias ? ` (Model Studio: ${model.studioAlias})` : ''}</li>)}
                              </ul></div>
                              <p>{meeraSummary.architecture}</p>
                              <div><h4 className="font-semibold text-white">What is implemented</h4><ul className="mt-2 space-y-2">{meeraCapabilities.map(item=><li key={item.title}><strong>{item.title}</strong><span className="block text-xs text-sky-200">{item.status}</span></li>)}</ul></div>
                              <div className="grid gap-3 sm:grid-cols-2">{['app','browser'].map(slot=><figure key={slot}><Image src={`/meeraai/screenshots/${slot === 'app' ? 'workspace' : 'browser-page'}.png`} width={1440} height={900} alt={`MeeraAI ${slot} screenshot supplied by Vidit`} className="rounded-xl border border-white/10"/><figcaption className="mt-2 text-xs text-slate-400">{slot === 'app' ? 'Desktop app' : 'Meera Browser'}  / current app screenshot.</figcaption></figure>)}</div>
                              <div><h4 className="font-semibold text-white">Test evidence</h4><p className="mt-2">{meeraSummary.evidence}</p></div>
                              <div><h4 className="font-semibold text-white">Current limitations</h4><p className="mt-2">{meeraSummary.limitations}</p></div>
                            </div>
                          </details>}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <Button
                            size="lg"
                            className="rounded-full px-6 transition-transform duration-300 group-hover:-translate-y-0.5"
                            onClick={() => handleProjectOpen(project)}
                          >
                            {live ? (project.ctaLabel || 'Open Project') : 'View Project'}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full border-white/15 bg-white/[0.08] px-6 text-white backdrop-blur-lg hover:bg-white/12 hover:text-white"
                            onClick={() => handleSourceOpen(project)}
                          >
                            <Github className="h-4 w-4" />
                            {hasExternalLink(project.githubUrl) ? 'GitHub' : 'Source'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <Dialog open={Boolean(comingSoonState)} onOpenChange={(open) => !open && setComingSoonState(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto border-white/10 bg-slate-950/90 text-white sm:max-w-3xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(2,6,23,0.92))]" />
            <div className="absolute right-[-3rem] top-[-2rem] h-32 w-32 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute bottom-[-3rem] left-[-2rem] h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />
          </div>

          <div className="relative">
            <DialogHeader className="text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-sky-100">
                <Clock3 className="h-3.5 w-3.5" />
                {comingSoonState?.action === 'project' ? 'Engineering details' : 'Source availability'}
              </div>
              <DialogTitle className="mt-4 text-2xl font-semibold tracking-tight text-white">
                {comingSoonState?.project.title}
              </DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-7 text-slate-300">
                {comingSoonState?.action === 'source'
                  ? 'No publicly inspectable source was available at the evidence check. This page does not expose private implementation details.'
                  : 'The supplied project description, engineering decisions, available evidence, and limitations.'}
              </DialogDescription>
            </DialogHeader>

            {comingSoonState?.action === 'project' && selectedSystem ? (
              <dl className="mt-6 grid gap-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm md:grid-cols-2">
                {[
                  ['Problem', selectedSystem.problem],
                  ['Engineering approach', selectedSystem.approach],
                  ['Architecture', selectedSystem.architecture],
                  ['Technologies / concepts', selectedSystem.technologies.join(' / ') || 'Not publicly verified'],
                  ['Important decisions', selectedSystem.decisions],
                  ['Evidence', selectedSystem.evidence],
                  ['Limitations', selectedSystem.limitations],
                  ['Proposed next step', selectedSystem.nextStep],
                ].map(([label,text]) => <div key={label}><dt className="font-semibold text-white">{label}</dt><dd className="mt-2 leading-7 text-slate-300">{text}</dd></div>)}
              </dl>
            ) : <p className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">Project names and broad direction are supplied by Vidit. Private implementation details are not exposed.</p>}

            <DialogFooter className="mt-6">
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => setComingSoonState(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
