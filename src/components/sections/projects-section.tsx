'use client';

import { MeeraImage as Image } from '@/components/shared/meera-image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, Github } from 'lucide-react';
import { useState } from 'react';

import { projects, type Project } from '@/lib/data';
import { featuredSystems } from '@/lib/engineering-profile';
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

const meeraModelProfiles = [
  { name: 'Meera Nano', specs: ['Qwen3.5', '0.8B', 'IQ4_XS'] },
  { name: 'Meera Mini', specs: ['Qwen3.5', '2B', 'IQ4_XS'] },
  { name: 'Meera Edge', specs: ['Ministral 3', '3B', 'IQ4_XS'] },
  { name: 'Meera', specs: ['Qwen3.5', '4B', 'IQ4_XS'], alias: 'Model Studio: Meera Pro' },
  { name: 'Meera Vision', specs: ['Gemma 4 E4B', 'E4B', '8B total', 'IQ4_XS'], alias: 'Model Studio: Meera Max' },
  { name: 'Meera Deep', specs: ['Ministral 3 Reasoning', '8B', 'IQ3_M'] },
  { name: 'Meera Ultra', specs: ['Qwen3.5', '9B', 'IQ3_M'] },
];

const meeraImplementation = [
  { title: 'Chat with a local model', status: 'Routing tested' },
  { title: 'Manage and tune models', status: 'Implemented in source' },
  { title: 'Browse alongside your assistant', status: 'Implemented in source' },
  { title: 'Use browser tools for a task', status: 'End-to-end testing pending' },
  { title: 'Work with files and documents', status: 'Source and export artifacts' },
  { title: 'Review changes before accepting them', status: 'Workspace and task tests passed' },
  { title: 'Run and monitor commands', status: 'Process tests passed' },
  { title: 'Keep useful context', status: 'Implemented; known test failures' },
  { title: 'Plan tasks and connect tools', status: 'Implemented in source' },
  { title: 'Choose local, hybrid, or cloud paths', status: 'Configuration dependent' },
];

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
          <AnimatedDiv className="mx-auto max-w-3xl text-center">
            <h2 className="mt-6 font-headline text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Project Index
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Local AI, software systems, and API experimentation. Each project describes its implementation and the evidence available for it.
            </p>
          </AnimatedDiv>

          <div className="mt-14 grid items-start gap-6 lg:grid-cols-2">
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
                  className="group relative h-[32rem] self-start overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/70"
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

                  <div className="relative h-full p-4 sm:p-5">
                    <div className="flex h-full min-h-0 flex-col justify-between rounded-[1.65rem] border border-white/10 bg-slate-950/28 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px] sm:p-7">
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
                          {project.internalHref === '/meeraai' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-5 rounded-full border-sky-300/25 bg-sky-400/[0.06] text-sky-100 hover:bg-sky-400/15 hover:text-white"
                              onClick={() => setMeeraDetailsOpen(true)}
                            >
                              Technical details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
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



      <Dialog open={meeraDetailsOpen} onOpenChange={setMeeraDetailsOpen}>
        <DialogContent className="max-h-[88dvh] overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/95 p-0 text-white shadow-[0_35px_110px_-35px_rgba(2,6,23,0.95)] backdrop-blur-3xl sm:max-w-5xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-[90px]" />
            <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-blue-600/10 blur-[90px]" />
          </div>
          <div className="relative max-h-[88dvh] overflow-y-auto overscroll-contain">
            <div className="sticky top-0 z-20 border-b border-white/[0.08] bg-slate-950/85 px-6 py-6 backdrop-blur-2xl sm:px-8">
              <DialogHeader className="pr-8 text-left">
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/[0.07] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sky-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]" />
                  MeeraAI / Technical overview
                </div>
                <DialogTitle className="font-headline text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
                  MeeraAI Desktop Assistant &amp; Meera Browser
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Local model profiles, application architecture, implemented workflows, and the evidence and limitations from the source review.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="relative space-y-5 px-5 py-6 sm:px-8 sm:py-7">
              <section className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Model configuration</p>
                    <h3 className="mt-1 font-headline text-lg font-semibold text-white">The seven local profiles</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[0.65rem] text-slate-400">07 PROFILES</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {meeraModelProfiles.map((model, index) => (
                    <div key={model.name} className="rounded-[1.15rem] border border-white/[0.08] bg-slate-950/55 p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-sky-300/15 bg-sky-300/[0.07] font-mono text-[0.65rem] text-sky-200">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <strong className="text-sm font-semibold text-white">{model.name}</strong>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {model.specs.map(spec => (
                          <span key={spec} className="rounded-full border border-white/[0.09] bg-white/[0.045] px-2.5 py-1 text-[0.65rem] font-medium text-slate-300">{spec}</span>
                        ))}
                      </div>
                      {model.alias && <p className="mt-3 text-xs text-sky-200/80">{model.alias}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-6">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">System design</p>
                <h3 className="mt-1 font-headline text-lg font-semibold text-white">Architecture</h3>
                <p className="mt-4 rounded-[1.1rem] border border-sky-300/10 bg-slate-950/65 p-4 text-sm leading-7 text-slate-300 sm:p-5">
                  React/TypeScript UI -&gt; Electron IPC and FastAPI -&gt; chat/tool services -&gt; native GGUF runtime. Qwen3.5 and reasoning profiles use llama-server; other profiles can use llama-cpp-python. Electron webviews power Meera Browser, while a separate Playwright service handles backend browser automation.
                </p>
              </section>

              <section className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-6">
                <div className="mb-5">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Feature inventory</p>
                  <h3 className="mt-1 font-headline text-lg font-semibold text-white">What is implemented</h3>
                </div>
                <div className="grid gap-2.5 md:grid-cols-2">
                  {meeraImplementation.map((item, index) => {
                    const pending = item.status.includes('pending') || item.status.includes('known test failures');
                    const verified = item.status.includes('tested') || item.status.includes('passed');
                    const tone = pending
                      ? 'border-amber-300/15 bg-amber-300/[0.045] text-amber-200'
                      : verified
                        ? 'border-emerald-300/15 bg-emerald-300/[0.045] text-emerald-200'
                        : 'border-sky-300/15 bg-sky-300/[0.045] text-sky-200';
                    return (
                      <div key={item.title} className="flex min-h-[5.25rem] items-start gap-3 rounded-[1.1rem] border border-white/[0.07] bg-slate-950/45 p-3.5">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035] font-mono text-[0.62rem] text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-5 text-slate-100">{item.title}</p>
                          <span className={"mt-2 inline-flex rounded-full border px-2.5 py-1 text-[0.62rem] font-medium leading-4 " + tone}>{item.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-6">
                <div className="mb-5">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Application captures</p>
                  <h3 className="mt-1 font-headline text-lg font-semibold text-white">MeeraAI &amp; Meera Browser</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <a href="/meeraai/screenshots/workspace.png" target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/70 transition-colors hover:border-sky-300/30">
                    <div className="overflow-hidden">
                      <Image src="/meeraai/screenshots/workspace.png" width={1440} height={900} alt="MeeraAI desktop workspace" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <span className="text-sm font-medium text-slate-200">MeeraAI desktop app</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-sky-200" />
                    </div>
                  </a>
                  <a href="/meeraai/screenshots/browser-page.png" target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/70 transition-colors hover:border-sky-300/30">
                    <div className="overflow-hidden">
                      <Image src="/meeraai/screenshots/browser-page.png" width={1440} height={900} alt="Meera Browser page" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <span className="text-sm font-medium text-slate-200">Meera Browser page</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-sky-200" />
                    </div>
                  </a>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/[0.09] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:p-6">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-500">Verification</p>
                <h3 className="mt-1 font-headline text-lg font-semibold text-white">Test evidence</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Local source reviewed on 15 September 2026. All 22 routing/workspace/task/process/scanner/knowledge regression tests passed. Logs record Qwen3.5 local generation, and generated document artifacts are present. Browser and vision behavior has not been validated end to end in this review.
                </p>
              </section>

              <section className="rounded-[1.5rem] border border-amber-300/15 bg-amber-300/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-6">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-amber-200/65">Known constraints</p>
                <h3 className="mt-1 font-headline text-lg font-semibold text-white">Current limitations</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Seven profiles are configured, not seven independently evaluated model releases. Model Studio uses Pro/Max aliases for Meera/Vision and lists different Max quantizations from the backend policy. The live BF16 smoke run failed; memory cleanup and one role test also fail. No universal VRAM, speed, privacy, autonomous-task success, or signed macOS release guarantee is established.
                </p>
              </section>

              <div className="flex justify-end pb-1 pt-1">
                <Button size="lg" className="rounded-full px-6" onClick={() => setMeeraDetailsOpen(false)}>
                  Close overview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
