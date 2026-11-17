'use client';

import { MeeraImage as Image } from '@/components/shared/meera-image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Clock3, Github, Layers3, Sparkles } from 'lucide-react';
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
  const [meeraDetailsOpen, setMeeraDetailsOpen] = useState(false);

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
          <AnimatedDiv className="mb-12 flex flex-col justify-between gap-7 border-b border-white/10 pb-9 lg:flex-row lg:items-end">
            <div className="flex items-start gap-4 sm:gap-5">
              <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/[0.08] font-mono text-sm font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                01
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]" />
                  Portfolio / Selected work
                </p>
                <h2 className="mt-2 font-headline text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                  Project <span className="underline-gradient">Index.</span>
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  A collection of engineering work across local AI, robotics, computer vision, and software systems.
                </p>
              </div>
            </div>

            <div className="glass-strong flex w-fit items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[0_16px_40px_-28px_rgba(2,6,23,0.9)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-primary">
                <Layers3 className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Selected work</span>
                <span className="mt-0.5 block font-headline text-lg font-semibold text-white">
                  {String(projects.length).padStart(2, '0')} <span className="text-xs font-medium text-slate-400">projects</span>
                </span>
              </span>
            </div>
          </AnimatedDiv>

          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-7">
            {projects.map((project, index) => {
              const live = isProjectLive(project);
              const categoryLabel = project.eyebrow.replace(/^\\d+\\s\\/\\s/, '');
              const statusLabel = project.status.includes('Public source available')
                ? 'Public source'
                : project.status.startsWith('Local source reviewed')
                  ? 'Source reviewed'
                  : 'Project brief';
              const statusTone = statusLabel === 'Public source'
                ? 'bg-emerald-400/10 text-emerald-200'
                : statusLabel === 'Source reviewed'
                  ? 'bg-sky-400/10 text-sky-200'
                  : 'bg-white/[0.06] text-slate-300';

              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.16 }}
                  transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.045 }}
                  whileHover={{ y: -5 }}
                  className="group relative h-[32rem] self-start overflow-hidden rounded-[2.25rem] border border-white/[0.11] bg-slate-950/80 shadow-[0_28px_80px_-48px_rgba(2,6,23,0.9)] transition-[border-color,box-shadow] duration-500 hover:border-sky-300/25 hover:shadow-[0_34px_90px_-48px_rgba(56,189,248,0.18)]"
                  style={{ boxShadow: `0 28px 90px -60px ${project.glow}` }}
                >
                  <div className="absolute inset-0 opacity-95" style={{ backgroundImage: project.backdrop }} />
                  {project.image ? (
                    <>
                      <Image
                        src={project.image.imageUrl}
                        alt={project.image.description}
                        fill
                        className="scale-[1.1] object-cover opacity-[0.35] blur-[30px] saturate-[1.15] transition-all duration-700 ease-out group-hover:scale-[1.16] group-hover:opacity-45"
                        sizes="(max-width: 1023px) 100vw, 50vw"
                        priority={index < 2}
                        data-ai-hint={project.image.imageHint}
                      />
                      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[10px]" />
                    </>
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(2,6,23,0.82)_48%,rgba(2,6,23,0.97))]" />
                  <div
                    className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at top, ${project.glow}, transparent 34%)` }}
                  />
                  <div className="absolute inset-[1px] rounded-[calc(2.25rem-1px)] border border-white/[0.055]" />

                  <div className="relative h-full p-3 sm:p-4">
                    <div className="flex h-full min-h-0 flex-col rounded-[1.9rem] border border-white/[0.09] bg-slate-950/[0.42] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-[30px] sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.055] font-mono text-xs font-semibold text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-slate-500">PROJECT / {String(index + 1).padStart(2, '0')}</p>
                            <p className="mt-1 truncate text-[0.62rem] font-medium uppercase tracking-[0.13em] text-slate-300">{categoryLabel}</p>
                          </div>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.09] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.04em] backdrop-blur-xl ${statusTone}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_9px_currentColor]" />
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-auto min-h-0 pt-7">
                        <div className="min-h-[8.25rem]">
                          <h3 className="font-headline text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.035em] text-white sm:text-[1.95rem] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                            {project.title}
                          </h3>
                          <p className="mt-3 max-w-xl overflow-hidden text-sm leading-6 text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                            {project.description}
                          </p>
                        </div>

                        {project.internalHref === '/meeraai' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 rounded-full border-sky-300/20 bg-sky-300/[0.055] px-4 text-xs text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition-all hover:border-sky-200/35 hover:bg-sky-300/10 hover:text-white"
                            onClick={() => setMeeraDetailsOpen(true)}
                          >
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            Technical overview
                            <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        )}

                        <div className="mt-5 flex min-h-7 flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/[0.09] bg-white/[0.045] px-3 py-1 text-[0.66rem] font-medium text-slate-300 backdrop-blur-xl"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2 border-t border-white/[0.09] pt-4">
                        <Button
                          size="lg"
                          className="h-11 rounded-full px-5 text-xs font-semibold shadow-[0_10px_28px_-16px_rgba(59,130,246,0.85)] transition-all duration-300 hover:-translate-y-0.5"
                          onClick={() => handleProjectOpen(project)}
                        >
                          {live ? (project.ctaLabel || 'Open project') : 'View project'}
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-11 rounded-full border-white/[0.12] bg-white/[0.045] px-5 text-xs font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
                          onClick={() => handleSourceOpen(project)}
                        >
                          <Github className="mr-2 h-4 w-4" />
                          {hasExternalLink(project.githubUrl) ? 'Source' : 'Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>


      <Dialog open={meeraDetailsOpen} onOpenChange={setMeeraDetailsOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/90 text-white shadow-[0_35px_100px_-35px_rgba(2,6,23,0.9)] backdrop-blur-3xl sm:max-w-4xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
              MeeraAI — technical overview
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-slate-300">
              Local models, application architecture, implemented capabilities, test evidence, and current limitations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 text-sm leading-7 text-slate-200">
            <p className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 text-slate-300">{meeraSummary.approach}</p>
            <section>
              <h3 className="font-semibold text-white">The seven local profiles</h3>
              <ul className="mt-2 space-y-2">
                {meeraModels.map(model => (
                  <li key={model.id}>
                    <strong>{model.name}</strong>: {model.model} / {model.parameters} / {model.quantization}{model.studioAlias ? ` (Model Studio: ${model.studioAlias})` : ''}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-semibold text-white">Architecture</h3>
              <p className="mt-2">{meeraSummary.architecture}</p>
            </section>
            <section>
              <h3 className="font-semibold text-white">What is implemented</h3>
              <ul className="mt-2 space-y-2">
                {meeraCapabilities.map(item => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span className="block text-xs text-sky-200">{item.status}</span>
                  </li>
                ))}
              </ul>
            </section>
            <div className="grid gap-4 sm:grid-cols-2">
              <figure>
                <Image src="/meeraai/screenshots/workspace.png" width={1440} height={900} alt="MeeraAI desktop workspace" className="rounded-[1.35rem] border border-white/10 shadow-lg shadow-black/20" />
                <figcaption className="mt-2 text-xs text-slate-400">MeeraAI desktop app</figcaption>
              </figure>
              <figure>
                <Image src="/meeraai/screenshots/browser-page.png" width={1440} height={900} alt="Meera Browser page" className="rounded-[1.35rem] border border-white/10 shadow-lg shadow-black/20" />
                <figcaption className="mt-2 text-xs text-slate-400">Meera Browser</figcaption>
              </figure>
            </div>
            <section>
              <h3 className="font-semibold text-white">Test evidence</h3>
              <p className="mt-2">{meeraSummary.evidence}</p>
            </section>
            <section>
              <h3 className="font-semibold text-white">Current limitations</h3>
              <p className="mt-2">{meeraSummary.limitations}</p>
            </section>
          </div>
          <DialogFooter>
            <Button size="lg" className="rounded-full px-6" onClick={() => setMeeraDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(comingSoonState)} onOpenChange={(open) => !open && setComingSoonState(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/90 text-white shadow-[0_35px_100px_-35px_rgba(2,6,23,0.9)] backdrop-blur-3xl sm:max-w-3xl">
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
