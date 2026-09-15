'use client';

import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Brain, CheckCircle2, ChevronLeft, ChevronRight, Cpu, Download, Gauge, Layers3, Lock, MailCheck, Monitor, Pause, Play, Send, Settings, Sparkles, TerminalSquare, Workflow, X } from 'lucide-react';
import { MeeraImage as Image } from '@/components/shared/meera-image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { avatarImage } from '@/lib/data';
import { meeraModels, meeraSummary } from '@/lib/meeraai-content';
import { MeeraAICapabilities } from './meeraai-capabilities';
import { meeraAIDownloads } from '@/lib/meeraai-downloads';
import { cn } from '@/lib/utils';
import { meeraScreenshots } from '@/lib/meeraai-screenshots';

const screenshots = {
  welcome: '/meeraai/screenshots/workspace.png',
  dashboard: '/meeraai/screenshots/browser-page.png',
  engine: '/meeraai/screenshots/terminal.png',
  sidebar: '/meeraai/screenshots/session-sidebar.png',
  settings: '/meeraai/screenshots/control-center.png',
  logo: '/meeraai/Logo/logo.png',
} as const;

const suggestionFormId = 'mdkweber';

const quickStats = [
 { value: '7 profiles', label: 'curated local tiers' },
 { value: 'GGUF', label: 'native model runtime' },
 { value: 'Browser', label: 'integrated workspace' },
 { value: '22 checks', label: 'regression tests passed' },
];
const heroSignals = [
 { icon: Monitor, title: 'A desktop assistant', text: 'Chat, documents, model controls, and coding tasks share one application.' },
 { icon: Cpu, title: 'Seven local profiles', text: 'Qwen3.5, Ministral 3, and Gemma 4 E4B are mapped to named tiers in the app.' },
 { icon: Workflow, title: 'Meera Browser', text: 'Browse in Electron webviews and ask the assistant about the current page.' },
];
const tierIcons = [Brain, Cpu, Workflow, Sparkles, Monitor, TerminalSquare, Gauge];
const tierGlows = ['rgba(56,189,248,0.3)', 'rgba(34,211,238,0.3)', 'rgba(59,130,246,0.3)', 'rgba(129,140,248,0.3)', 'rgba(244,114,182,0.3)', 'rgba(251,191,36,0.3)', 'rgba(190,242,100,0.3)'];
const modelLineup = meeraModels.map((model, index) => ({
 id: model.id, name: model.name,
 detail: `${model.model} / ${model.parameters}. ${model.studioAlias ? `Model Studio label: ${model.studioAlias}. ` : ''}Configured for ${model.role}; this role is not a measured quality score.`,
 vram: model.quantization + ' GGUF', capability: model.role,
 pathways: model.capabilities.join(', '),
 architecture: `${model.model} / ${model.parameters}`,
 accent: 'bg-gradient-to-br from-sky-400/20 to-slate-900/10',
 glow: tierGlows[index], icon: tierIcons[index],
}));
const coreFeatures = [
 { icon: Brain, title: 'Seven curated GGUF profiles', text: 'Nano, Mini, Edge, Meera, Vision, Deep, and Ultra map to selected open-weight model families.', color: 'from-blue-500/20 to-sky-500/0', accent: 'text-blue-400', glow: 'rgba(59,130,246,0.15)' },
 { icon: Cpu, title: 'Runtime controls', text: 'Adjust context length, GPU offload, CPU threads, batch sizes, and KV-cache settings. Actual memory use depends on the model and configuration.', color: 'from-emerald-500/20 to-teal-500/0', accent: 'text-emerald-400', glow: 'rgba(16,185,129,0.15)' },
 { icon: Monitor, title: 'An integrated browser', text: 'Tabs, history, bookmarks, reader tools, and a page-aware assistant are implemented in Meera Browser.', color: 'from-amber-500/20 to-orange-500/0', accent: 'text-amber-400', glow: 'rgba(245,158,11,0.15)' },
 { icon: Workflow, title: 'Reviewed coding tasks', text: 'Structured tasks, workspace snapshots, diffs, acceptance/rejection, and process output give coding work an inspectable lifecycle.', color: 'from-indigo-500/20 to-purple-500/0', accent: 'text-indigo-400', glow: 'rgba(99,102,241,0.15)' },
 { icon: Settings, title: 'A model library', text: 'Search Hugging Face, select GGUF files, download models, inspect installed files, and change runtime settings from Model Studio.', color: 'from-rose-500/20 to-pink-500/0', accent: 'text-rose-400', glow: 'rgba(244,63,94,0.15)' },
 { icon: Layers3, title: 'Documents and context', text: 'Document indexing, export generation, selective memory, roles, and MCP tools have dedicated backend modules. Some integrations require optional dependencies or services.', color: 'from-cyan-500/20 to-blue-500/0', accent: 'text-cyan-400', glow: 'rgba(6,182,212,0.15)' },
];
const productJourney = [
 { id: 'welcome', title: 'Start with the desktop workspace', body: 'The React interface connects to the Python backend through the desktop runtime. Chat sessions, inference modes, attachments, and task controls live in the app. Developer setup still requires the backend dependencies; a fully automatic clean-machine installation has not been verified.', image: screenshots.welcome, alt: 'MeeraAI main workspace', caption: 'Main workspace with prompt composer and suggested prompts.' },
 { id: 'dashboard', title: 'Read a page with Meera Browser', body: 'The browser renders pages through Electron webviews. Quick actions extract the active page text and links and pass them to the assistant for summaries, explanations, and takeaways. The backend Playwright automation service is a separate browser runtime; it is not the same webview session.', image: screenshots.dashboard, alt: 'Meera Browser displaying a loaded webpage', caption: 'Meera Browser displaying the history of Lamborghini article.' },
 { id: 'engine', title: 'Work in the agentic terminal', body: 'The supplied screenshot shows the agentic terminal ready for a command or a task. The backend provides process output, command-risk checks, and controlled task execution. This empty terminal view illustrates the interface; the separate regression tests establish the tested process and task behaviors.', image: screenshots.engine, alt: 'MeeraAI agentic terminal before a command is entered', caption: 'Agentic terminal ready for a command or task.' },
 { id: 'settings', title: 'Find your controls in Control Center', body: 'Control Center brings settings navigation into one panel. This screenshot shows the About page and navigation for context, terminal history, appearance, models, and wallpaper. Runtime settings and the seven model mappings are described elsewhere on this page; this image does not show a loaded model or its configuration.', image: screenshots.settings, alt: 'MeeraAI Control Center showing the About page', caption: 'Control Center / About page.' },
];
const technicalPoints = [
 'The seven profiles use existing model families; MeeraAI is the application and orchestration layer.',
 'Local requests select native GGUF inference without a silent cloud switch.',
 'Backend tier policy: IQ4_XS for tiers 1-5, IQ3_M for tiers 6-7.',
 'Recorded Qwen3.5 runs use IQ4_NL, so installed quantizations differ from the preferred policy.',
 'Electron webviews render Meera Browser; Playwright runs separate backend browser automation.',
 'Document indexing, exports, MCP tools, and memory are implemented with optional dependencies.',
 '22 focused regression tests passed; browser, vision, and seven-tier quality evaluation remain pending.',
];
const engineeringSignals = [
 'I am Vidit Shah, a Robotics & AI Engineer and B.E. Robotics & Automation graduate (GTU, 2026; CGPA 8.45/10).',
 meeraSummary.approach, meeraSummary.architecture,
 'I test the application boundaries as well as model output. The latest focused regression run passed all 22 routing, task, workspace, process, scanner, and knowledge checks.',
 'I am still validating browser tasks, visual inputs, memory behavior, and packaged releases. Implemented features and recorded runs are described separately from proven end-to-end results.',
];
const inferenceNotes = [
 { title: 'The models behind the tiers', text: 'Qwen3.5, Ministral 3, and Gemma 4 E4B provide the underlying model weights. The names in MeeraAI describe app profiles, not models I trained from scratch.', icon: Layers3 },
 { title: 'Quantization and memory', text: 'GGUF quantization reduces weight storage, but the context cache and offload configuration also use memory. The backend policy and installed file can differ; no universal 4GB/6GB fit is claimed.', icon: Gauge },
 { title: 'Two browser layers', text: 'Meera Browser supplies the visible Electron browsing workspace. A separate Playwright service implements automation tools and requires its own browser installation. Document and MCP paths may use external services.', icon: Monitor },
 { title: 'What the tests establish', text: 'The focused suite covers routing and controlled software behaviors. Runtime logs show generation, but do not establish answer quality. The failed live smoke run and remaining validation gaps are listed below.', icon: CheckCircle2 },
];
const heroPreviewCards = [
 { id: 'hero-dashboard', eyebrow: 'Desktop app', title: 'Chat and project workspace', text: 'Chat, files, tasks, and model controls in one application.', body: productJourney[0].body, image: screenshots.welcome, alt: productJourney[0].alt, caption: productJourney[0].caption, accentClassName: 'from-sky-400/20 via-sky-400/5 to-transparent' },
 { id: 'hero-engine', eyebrow: 'Meera Browser', title: 'Pages with an assistant', text: 'Browse, extract page context, and ask for an explanation.', body: productJourney[1].body, image: screenshots.dashboard, alt: productJourney[1].alt, caption: productJourney[1].caption, accentClassName: 'from-indigo-400/20 via-indigo-400/5 to-transparent' },
 { id: 'hero-settings', eyebrow: 'Control Center', title: 'App settings', text: 'About, context, appearance, models, and wallpaper navigation.', body: productJourney[3].body, image: screenshots.settings, alt: productJourney[3].alt, caption: productJourney[3].caption, accentClassName: 'from-lime-300/18 via-lime-300/5 to-transparent' },
] as const;
const heroFlow = [
 { icon: Monitor, label: 'Open workspace' }, { icon: Brain, label: 'Load a model' },
 { icon: Workflow, label: 'Chat or browse' }, { icon: Settings, label: 'Review and tune' },
];
const technicalFocusMap = [[0,1],[2,3],[4,5],[6]] as const;
const technicalPointToInferenceIndex = technicalFocusMap.reduce<Record<number,number>>((acc,indexes,noteIndex)=>{indexes.forEach(index=>{acc[index]=noteIndex;});return acc;},{});
const sectionLinks = [
 { href: '#lineup', label: 'Models' }, { href: '#capabilities', label: 'Capabilities' },
 { href: '#validation', label: 'Testing' }, { href: '#flow', label: 'App & browser' },
 { href: '#engineering', label: 'Engineering' }, { href: '#feedback', label: 'Feedback' },
];
const lineupFacts = [
 { value: '7', label: 'curated profiles' }, { value: '0.8B-9B', label: 'model size range' },
 { value: 'GGUF', label: 'local weight format' },
];

const sectionOuterClass = 'scroll-mt-32 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12';
const sectionInnerClass = 'mx-auto w-full max-w-[110rem]';

function useClientReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return isReady;
}

function SectionTitle({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.4em] text-sky-300/80 sm:text-xs sm:tracking-[0.45em]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white lg:text-3xl">{title}</h2>
      <p className="mt-3.5 max-w-2xl text-[0.92rem] leading-6 text-slate-300 sm:mt-4 sm:text-[0.95rem] sm:leading-7">{body}</p>
    </div>
  );
}

function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-white/12 bg-white/[0.05] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

function ScrollBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isReady = useClientReady();
  const reduceMotion = useReducedMotion();
  const allowMotion = isReady && !reduceMotion;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 35%'],
  });

  const y = useTransform(scrollYProgress, [0, 1], allowMotion ? [56, 0] : [0, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 1], allowMotion ? [0.2, 0.85, 1] : [1, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], allowMotion ? [0.975, 1] : [1, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
}

function HoverTilt({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const isReady = useClientReady();
  const reduceMotion = useReducedMotion();
  const allowMotion = isReady && !reduceMotion;
  const rotateX = useSpring(0, { stiffness: 180, damping: 18, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 180, damping: 18, mass: 0.5 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const handleMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!allowMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateYValue = ((px - 50) / 50) * 7;
    const rotateXValue = ((50 - py) / 50) * 7;

    glowX.set(px);
    glowY.set(py);
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={
        !allowMotion
          ? undefined
          : {
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }
      }
      whileHover={allowMotion ? { y: -8, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className={cn('relative h-full w-full', className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(125, 211, 252, 0.22), transparent 35%)`,
        }}
      />
      <div className="relative h-full w-full" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  );
}

function ScreenshotCard({
  src,
  alt,
  caption,
  className,
  imageClassName,
  frameClassName,
  priority = false,
  animateImageOnLoad = false,
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
  imageClassName?: string;
  frameClassName?: string;
  priority?: boolean;
  animateImageOnLoad?: boolean;
}) {
  return (
    <HoverTilt className={className}>
      <GlassPanel className="group flex h-full flex-col overflow-hidden">
        <div
          className={cn(
            'relative w-full overflow-hidden bg-slate-950/40',
            frameClassName || 'aspect-[16/10]'
          )}
        >
          <motion.div
            initial={animateImageOnLoad ? { scale: 1.08, opacity: 0.88 } : false}
            animate={animateImageOnLoad ? { scale: 1, opacity: 1 } : undefined}
            transition={animateImageOnLoad ? { duration: 0.75, ease: 'easeOut' } : undefined}
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
          >
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              className={cn('h-full w-full object-contain p-2', imageClassName)}
              sizes="(max-width: 1024px) 100vw, 780px"
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617]/40 via-transparent to-white/5 opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
        </div>
        <div
          className="mt-auto border-t border-white/10 bg-black/20 px-3 py-2.5 text-[9px] uppercase tracking-[0.22em] leading-4 text-slate-400 sm:px-4 sm:py-3 sm:text-[10px] sm:tracking-widest sm:leading-5"
        >
          {caption}
        </div>
      </GlassPanel>
    </HoverTilt>
  );
}

function HeroPreviewTile({
  eyebrow,
  title,
  text,
  image,
  alt,
  accentClassName,
  allowMotion,
  onClick,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  accentClassName: string;
  allowMotion: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={allowMotion ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="group relative overflow-hidden rounded-[1.15rem] border border-white/10 bg-slate-950/45 p-2 text-left shadow-[0_26px_70px_-48px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:rounded-[1.25rem] sm:p-2.5"
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90', accentClassName)} />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/5" />

      <div className="relative overflow-hidden rounded-[1rem] border border-white/10 bg-slate-950/45">
        <div className="relative aspect-[2.4/1]">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.05]"
            sizes="(max-width: 1280px) 100vw, 320px"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020617]/55 via-transparent to-white/5" />
        </div>
      </div>

      <div className="relative mt-2 flex items-start gap-2 sm:mt-2.5 sm:gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.54rem] font-bold uppercase tracking-[0.28em] text-sky-300/80 sm:text-[0.58rem] sm:tracking-[0.34em]">{eyebrow}</p>
          <h3 className="mt-1 text-[0.86rem] font-semibold tracking-tight text-white sm:mt-1.5 sm:text-[0.92rem]">{title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[0.76rem] leading-[1.15rem] text-slate-300 sm:text-[0.82rem] sm:leading-5">{text}</p>
        </div>
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-sky-300 transition-all duration-300 group-hover:border-sky-300/30 group-hover:bg-white/[0.1] group-hover:text-white sm:h-9 sm:w-9">
          <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
        </div>
      </div>
    </motion.button>
  );
}

function ScreenshotSequence({
  allowMotion,
  onOpen,
}: {
  allowMotion: boolean;
  onOpen: (shot: (typeof meeraScreenshots)[number]) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const current = meeraScreenshots[activeIndex];
  const duration = 2000;

  const move = (step: number) => {
    setDirection(step >= 0 ? 1 : -1);
    setActiveIndex((index) => (index + step + meeraScreenshots.length) % meeraScreenshots.length);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setDirection(1);
      setActiveIndex((index) => (index + 1) % meeraScreenshots.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPlaying]);

  return (
    <div
      className="mx-auto mt-6 w-full max-w-[62rem] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(14,25,46,0.88),rgba(5,9,22,0.96))] shadow-[0_30px_80px_-50px_rgba(56,189,248,0.42)]"
    >
      <div className="relative aspect-[1242/781] min-h-[14rem] overflow-hidden bg-slate-950 sm:min-h-[19.5rem]">
        <AnimatePresence mode="sync" initial={false}>
          <motion.button
            key={current.id}
            type="button"
            onClick={() => onOpen(current)}
            initial={allowMotion ? { opacity: 0, scale: 1.055, filter: 'blur(14px)' } : false}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={allowMotion ? { opacity: 0, scale: 0.985, filter: 'blur(10px)' } : { opacity: 0 }}
            transition={{ duration: allowMotion ? 0.62 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full cursor-zoom-in"
            aria-label={`Open ${current.title}`}
          >
            <Image src={current.image} alt={current.alt} fill priority sizes="(max-width: 1200px) 100vw, 88rem" className="object-contain" />
          </motion.button>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.58),transparent_38%,transparent_62%,rgba(2,6,23,0.35)),linear-gradient(0deg,rgba(2,6,23,0.68),transparent_38%)]" />
        <motion.div
          key={`transition-wash-${current.id}`}
          aria-hidden="true"
          initial={allowMotion ? { x: direction > 0 ? '-115%' : '115%', opacity: 0 } : false}
          animate={allowMotion ? { x: direction > 0 ? '115%' : '-115%', opacity: [0, 0.52, 0] } : undefined}
          transition={{ duration: 0.76, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-y-0 w-[38%] bg-[linear-gradient(90deg,transparent,rgba(186,230,253,0.42),rgba(125,211,252,0.14),transparent)] blur-3xl"
        />
        <motion.div
          key={`glow-${current.id}`}
          aria-hidden="true"
          initial={allowMotion ? { x: '-30%', opacity: 0 } : false}
          animate={allowMotion ? { x: '130%', opacity: [0, 0.36, 0] } : undefined}
          transition={{ duration: 1.25, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.22),transparent)] blur-2xl"
        />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <div className="max-w-xl">
            <motion.p key={`number-${current.id}`} initial={allowMotion ? { opacity: 0, y: 9 } : false} animate={{ opacity: 1, y: 0 }} className="text-[0.62rem] font-bold uppercase tracking-[0.32em] text-sky-200">
              Screen {String(activeIndex + 1).padStart(2, '0')} / {String(meeraScreenshots.length).padStart(2, '0')}
            </motion.p>
            <motion.h3 key={`title-${current.id}`} initial={allowMotion ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mt-1.5 text-lg font-semibold text-white sm:text-2xl">
              {current.title}
            </motion.h3>
            <motion.p key={`caption-${current.id}`} initial={allowMotion ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-200 sm:text-sm sm:leading-6">
              {current.caption}
            </motion.p>
          </div>
          <button type="button" onClick={() => setIsPlaying((playing) => !playing)} className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white backdrop-blur-xl transition hover:border-sky-300 hover:text-sky-200" aria-label={isPlaying ? 'Pause sequence' : 'Play sequence'}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 bg-slate-950/65 p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:border-sky-300/45 hover:text-sky-200" aria-label="Previous screenshot"><ChevronLeft className="h-4 w-4" /></button>
          <div className="grid flex-1 grid-cols-9 gap-1.5 sm:gap-2">
            {meeraScreenshots.map((shot, index) => <button key={shot.id} type="button" onClick={() => { setDirection(index >= activeIndex ? 1 : -1); setActiveIndex(index); }} className={cn('group relative aspect-[16/10] overflow-hidden rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300', index === activeIndex ? 'border-sky-300/80 ring-1 ring-sky-300/50' : 'border-white/10 opacity-55 hover:opacity-100')} aria-label={`Show ${shot.title}`} aria-current={index === activeIndex ? 'true' : undefined}>
              <Image src={shot.image} alt="" fill sizes="120px" className="object-cover" />
              {index === activeIndex && <motion.span key={current.id} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: allowMotion && isPlaying ? duration / 1000 : 0, ease: 'linear' }} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-sky-300" />}
            </button>)}
          </div>
          <button type="button" onClick={() => move(1)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:border-sky-300/45 hover:text-sky-200" aria-label="Next screenshot"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function FeatureDeck({ features }: { features: typeof coreFeatures }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  return (
    <div className="relative h-[360px] w-full max-w-sm sm:h-[420px] sm:max-w-md lg:h-[500px] lg:max-w-lg">
      <AnimatePresence mode="popLayout" initial={false}>
        {features.map((feature, index) => {
          const position = (index - activeIndex + features.length) % features.length;
          const isFront = position === 0;
          const isVisible = position <= 2;

          if (!isVisible) return null;

          return (
            <motion.div
              key={feature.title}
              style={{
                zIndex: features.length - position,
                perspective: '1200px'
              }}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{
                opacity: 1,
                scale: 1 - position * 0.04,
                y: position * -18,
                x: 0,
                rotateX: position * -1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: -100,
                x: index % 2 === 0 ? 350 : -350,
                rotateZ: index % 2 === 0 ? 8 : -8,
                filter: 'blur(12px)'
              }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 24,
                mass: 1.5
              }}
              onClick={nextCard}
              className={cn(
                "absolute inset-0 cursor-pointer origin-bottom select-none",
                !isFront && "pointer-events-none"
              )}
            >
              <GlassPanel className={cn(
                "group h-full p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl transition-all duration-700 sm:p-7 lg:p-8",
                isFront ? "bg-slate-900 ring-1 ring-white/20 border-white/20" : "bg-slate-900/40 border-white/5 blur-[2px] opacity-30"
              )}>
                <div className={cn("absolute inset-x-0 top-0 h-1 transition-opacity duration-700", isFront ? "opacity-100" : "opacity-0", feature.color)} />

                <div className={cn("flex flex-col h-full transition-opacity duration-700", !isFront && "opacity-0")}>
                  <motion.div
                    className={cn("flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/10 bg-slate-950/80 shadow-inner sm:h-14 sm:w-14 sm:rounded-2xl", feature.accent)}
                    animate={{ rotate: isFront ? [0, 3, -3, 0] : 0 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <feature.icon className="h-7 w-7" />
                  </motion.div>

                  <div className="mt-8 flex flex-col items-center text-center lg:items-start lg:text-left">
                    <div className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-500 sm:px-3 sm:text-[0.62rem] sm:tracking-widest">
                      Module 0{index + 1}
                    </div>
                    <h3 className="mt-3 text-[1.4rem] font-bold tracking-tight text-white sm:mt-4 sm:text-2xl lg:text-3xl">
                      {feature.title}
                    </h3>

                    <div className="mt-4 max-w-sm text-[0.88rem] leading-6 text-slate-300 sm:mt-6 sm:text-sm sm:leading-8">
                      {feature.text}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4 sm:pt-6">
                    <div className="flex gap-2 sm:gap-2.5">
                      {features.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 rounded-full transition-all duration-700",
                            i === activeIndex ? "w-10 bg-sky-400" : "w-2 bg-white/10"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-[0.54rem] font-black uppercase tracking-[0.22em] text-white/30 transition-colors group-hover:text-sky-400 sm:text-[0.6rem] sm:tracking-[0.3em]">
                      Slide to explore
                    </div>
                  </div>
                </div>

                {isFront && (
                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[110px] transition-opacity duration-1000 opacity-40 pointer-events-none"
                    style={{ background: feature.glow }} />
                )}
              </GlassPanel>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="absolute -bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-6 sm:-bottom-24">
        <button
          onClick={nextCard}
          className="group flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/40 px-5 py-3 text-[0.56rem] font-black uppercase tracking-[0.28em] text-white backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95 sm:gap-4 sm:px-8 sm:py-4 sm:text-[0.65rem] sm:tracking-[0.4em]"
        >
          <span>Shift Ecosystem</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-2 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}

function SuggestionForm() {
  const [state, handleSubmit] = useForm(suggestionFormId);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'message' | null>(null);

  return (
    <GlassPanel className="relative h-full overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(15,23,42,0.68))]">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{
          backgroundImage: [
            'radial-gradient(circle at 72% 18%, rgba(56,189,248,0.12), transparent 24%)',
            'radial-gradient(circle at 66% 32%, rgba(56,189,248,0.18), transparent 26%)',
            'radial-gradient(circle at 72% 18%, rgba(56,189,248,0.12), transparent 24%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Card className="relative border-0 bg-transparent shadow-none">
        <CardContent className="p-6 sm:p-8">
          {state.succeeded ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[1.9rem] border border-emerald-400/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(15,23,42,0.7)_40%,rgba(15,23,42,0.92))] p-6 shadow-[0_36px_80px_-46px_rgba(16,185,129,0.4)] sm:p-8"
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                animate={{
                  backgroundImage: [
                    'radial-gradient(circle at 18% 16%, rgba(52,211,153,0.26), transparent 24%), radial-gradient(circle at 82% 20%, rgba(56,189,248,0.16), transparent 24%)',
                    'radial-gradient(circle at 28% 24%, rgba(52,211,153,0.24), transparent 24%), radial-gradient(circle at 74% 14%, rgba(56,189,248,0.18), transparent 24%)',
                    'radial-gradient(circle at 18% 16%, rgba(52,211,153,0.26), transparent 24%), radial-gradient(circle at 82% 20%, rgba(56,189,248,0.16), transparent 24%)',
                  ],
                }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/22 bg-emerald-400/10 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.28em] text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Feedback Received
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <motion.div
                    initial={{ scale: 0.88, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.35rem] border border-emerald-300/22 bg-emerald-400/12 shadow-[0_22px_48px_-30px_rgba(16,185,129,0.55)]"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                  </motion.div>

                  <div className="space-y-3">
                    <h3 className="text-3xl font-semibold tracking-tight text-white">Suggestion sent</h3>
                    <p className="max-w-xl text-sm leading-7 text-slate-200/92 sm:text-[0.96rem]">
                      Your message has been sent successfully and added to the feedback stream I use for future MeeraAI refinements, quality fixes, and product decisions.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200/90">
                      <MailCheck className="h-4 w-4" />
                      Delivered
                    </div>
                    <p className="text-sm leading-6 text-slate-200/90">
                      Your suggestion is now in the inbox queue for direct review.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-sky-200/90">
                      <Sparkles className="h-4 w-4" />
                      Impact
                    </div>
                    <p className="text-sm leading-6 text-slate-200/90">
                      The strongest inputs are workflow pain points, runtime friction, and concrete feature ideas.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/32 p-4 text-sm leading-7 text-slate-300">
                  Thanks for helping shape the next MeeraAI iterations. Good suggestions here directly influence polish, usability, and future capability planning.
                </div>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35 }}
                className="space-y-2"
              >
                <label htmlFor="name" className="text-sm font-medium text-slate-100">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    'border-white/12 bg-slate-950/40 text-white placeholder:text-slate-500 transition-all duration-300',
                    focusedField === 'name' && 'border-sky-300/40 bg-slate-950/55 shadow-[0_0_0_4px_rgba(56,189,248,0.08)]'
                  )}
                />
                <ValidationError errors={state.errors} field="name" prefix="Name" className="text-sm text-red-300" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="space-y-2"
              >
                <label htmlFor="email" className="text-sm font-medium text-slate-100">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    'border-white/12 bg-slate-950/40 text-white placeholder:text-slate-500 transition-all duration-300',
                    focusedField === 'email' && 'border-sky-300/40 bg-slate-950/55 shadow-[0_0_0_4px_rgba(56,189,248,0.08)]'
                  )}
                />
                <ValidationError errors={state.errors} field="email" prefix="Email" className="text-sm text-red-300" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="space-y-2"
                animate={
                  focusedField === 'message'
                    ? { scale: 1.01, y: -2 }
                    : { scale: 1, y: 0 }
                }
              >
                <label htmlFor="message" className="text-sm font-medium text-slate-100">
                  Suggestion
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder="Write your suggestion, improvement idea, or feedback for MeeraAI."
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    'border-white/12 bg-slate-950/40 text-white placeholder:text-slate-500 transition-all duration-300',
                    focusedField === 'message' && 'border-sky-300/40 bg-slate-950/55 shadow-[0_0_0_4px_rgba(56,189,248,0.08)]'
                  )}
                />
                <ValidationError
                  errors={state.errors}
                  field="message"
                  prefix="Message"
                  className="text-sm text-red-300"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: 0.18 }}
              >
                <Button
                  type="submit"
                  disabled={state.submitting}
                  className="w-full rounded-xl bg-sky-500 text-white hover:bg-sky-400 sm:w-auto"
                >
                  {state.submitting ? 'Sending...' : 'Send Suggestion'}
                  {!state.submitting && (
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex"
                    >
                      <Send className="h-4 w-4" />
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </form>
          )}
        </CardContent>
      </Card>
    </GlassPanel>
  );
}

function MeeraAIDockBrand() {
  return (
    <Link href="/meeraai" className="group flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10">
        <Image
          src={screenshots.logo}
          alt="MeeraAI logo"
          fill
          className="object-contain"
          sizes="36px"
          priority
        />
      </div>
      <span className="text-lg font-semibold tracking-tight text-white transition group-hover:text-sky-200">
        MeeraAI
      </span>
    </Link>
  );
}

export function MeeraAIFeaturePage() {
  const [hoveredFlowId, setHoveredFlowId] = useState<string | null>(null);
  const [hoveredTier, setHoveredTier] = useState<string | null>(modelLineup[0]?.id ?? null);
  const [activeInferenceIndex, setActiveInferenceIndex] = useState(0);
  const [activeEngineeringIndex, setActiveEngineeringIndex] = useState(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [focusItem, setFocusItem] = useState<{
    id: string;
    title: string;
    body: string;
    image: string;
    alt: string;
    caption: string;
  } | null>(null);
  const isReady = useClientReady();
  const reduceMotion = useReducedMotion();
  const allowMotion = isReady && !reduceMotion;
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(22);
  const glowX = useSpring(pointerX, { stiffness: 120, damping: 20, mass: 0.5 });
  const glowY = useSpring(pointerY, { stiffness: 120, damping: 20, mass: 0.5 });
  const dashboardY = useTransform(glowY, [0, 100], [-16, 16]);
  const dashboardX = useTransform(glowX, [0, 100], [-12, 12]);

  const heroGlow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(56, 189, 248, 0.2), transparent 24%)`;
  const activeTier = modelLineup.find((tier) => tier.id === hoveredTier) ?? modelLineup[0];
  const closeFocusItem = () => setFocusItem(null);

  const handleHeroPointer = (event: ReactMouseEvent<HTMLElement>) => {
    if (!allowMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  const resetHeroPointer = () => {
    pointerX.set(50);
    pointerY.set(22);
  };

  useEffect(() => {
    if (!focusItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFocusItem();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusItem]);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Dynamic Light Mode Map */
        html.light .meera-page-wrapper {
          background:
            radial-gradient(circle at top left, rgba(196,181,253,0.18), transparent 18%),
            radial-gradient(circle at 82% 88%, rgba(253,224,71,0.18), transparent 18%),
            linear-gradient(180deg, #fff7ed 0%, #fff3e8 52%, #fff8f1 100%) !important;
          color: #0f172a !important;
        }
        html.light .meera-page-wrapper .text-white { color: #0f172a !important; }
        html.light .meera-page-wrapper .text-slate-200 { color: #1e293b !important; }
        html.light .meera-page-wrapper .text-slate-300 { color: #334155 !important; }
        html.light .meera-page-wrapper .text-slate-400 { color: #64748b !important; }
        html.light .meera-page-wrapper .text-sky-300 { color: #0369a1 !important; }
        html.light .meera-page-wrapper .text-sky-300\\/80 { color: rgba(3, 105, 161, 0.85) !important; }
        html.light .meera-page-wrapper .text-sky-200 { color: #075985 !important; }
        html.light .meera-page-wrapper .text-sky-200\\/80 { color: rgba(7, 89, 133, 0.85) !important; }
        html.light .meera-page-wrapper .bg-sky-500 { background-color: #0284c7 !important; }
        html.light .meera-page-wrapper .hover\\:bg-sky-400:hover { background-color: #0369a1 !important; }
        html.light .meera-page-wrapper .text-lime-200 { color: #4d7c0f !important; }
        html.light .meera-page-wrapper .border-white\\/10 { border-color: rgba(0,0,0,0.1) !important; }
        html.light .meera-page-wrapper .border-white\\/12 { border-color: rgba(0,0,0,0.15) !important; }
        html.light .meera-page-wrapper .bg-slate-950\\/75 { background-color: rgba(255,248,243,0.92) !important; }
        html.light .meera-page-wrapper .bg-slate-950\\/70 { background-color: rgba(255,248,243,0.88) !important; }
        html.light .meera-page-wrapper .bg-slate-950\\/50 { background-color: rgba(255,248,243,0.86) !important; }
        html.light .meera-page-wrapper .bg-slate-950\\/45 { background-color: rgba(255,248,243,0.8) !important; }
        html.light .meera-page-wrapper .bg-slate-950\\/40,
        html.light .meera-page-wrapper .bg-slate-950\\/35,
        html.light .meera-page-wrapper .bg-slate-950\\/30 { background-color: rgba(15,23,42,0.03) !important; }
        html.light .meera-page-wrapper .bg-slate-900 { background-color: rgba(255,250,246,0.88) !important; }
        html.light .meera-page-wrapper .bg-slate-900\\/98 { background-color: rgba(255,250,246,0.96) !important; }
        html.light .meera-page-wrapper .bg-slate-900\\/60 { background-color: rgba(255,248,243,0.76) !important; }
        html.light .meera-page-wrapper .bg-slate-900\\/40 { background-color: rgba(255,248,243,0.62) !important; }
        html.light .meera-page-wrapper .bg-slate-900\\/30 { background-color: rgba(255,248,243,0.52) !important; }
        html.light .meera-page-wrapper .bg-white\\/\\[0\\.05\\] { background-color: rgba(255,255,255,0.72) !important; }
        html.light .meera-page-wrapper .bg-white\\/\\[0\\.04\\] { background-color: rgba(255,255,255,0.62) !important; }
        html.light .meera-page-wrapper .bg-white\\/\\[0\\.03\\] { background-color: rgba(255,255,255,0.52) !important; }
        html.light .meera-page-wrapper .bg-black\\/20 { background-color: rgba(248,250,252,0.96) !important; }
        html.light .meera-page-wrapper .from-\\[\\#020617\\]\\/40 { --tw-gradient-from: rgba(241,245,249,0.1) var(--tw-gradient-from-position) !important; }
        html.light .meera-page-wrapper .text-\\[10px\\] { color: #475569 !important; }
        html.light .meera-page-wrapper .text-white\\/30 { color: rgba(51,65,85,0.5) !important; }
        html.light .meera-page-wrapper .text-white\\/10 { color: rgba(51,65,85,0.2) !important; }
        html.light .meera-page-wrapper .bg-white\\/10 { background-color: rgba(255,255,255,0.72) !important; }
        html.light .meera-page-wrapper .border-white\\/5 { border-color: rgba(148,163,184,0.18) !important; }
        html.light .meera-page-wrapper .blur-\\[2px\\] { filter: blur(0px) !important; }
        html.light .meera-page-wrapper .bg-\\[\\#10172a\\] { background-color: rgba(255,249,244,0.98) !important; }
        html.light .meera-page-wrapper .bg-\\[\\#0d1222\\]\\/88 { background-color: rgba(255,250,246,0.94) !important; }
        html.light .meera-page-wrapper .bg-lime-300\\/8 { background-color: rgba(132,204,22,0.12) !important; }
        html.light .meera-page-wrapper .border-lime-300\\/18,
        html.light .meera-page-wrapper .border-lime-300\\/20 { border-color: rgba(132,204,22,0.25) !important; }
        html.light .meera-page-wrapper .bg-\\[linear-gradient\\(180deg\\,rgba\\(20\\,28\\,45\\,0\\.98\\)\\,rgba\\(17\\,24\\,39\\,0\\.95\\)\\)\\] {
            background: linear-gradient(180deg, rgba(255,251,247,0.96), rgba(255,245,238,0.92)) !important;
        }
        html.light .meera-page-wrapper .bg-\\[linear-gradient\\(180deg\\,rgba\\(17\\,24\\,39\\,0\\.96\\)\\,rgba\\(15\\,23\\,42\\,0\\.92\\)\\)\\] {
            background: linear-gradient(180deg, rgba(255,251,247,0.92), rgba(255,244,236,0.88)) !important;
        }
        html.light .meera-page-wrapper .bg-\\[linear-gradient\\(180deg\\,rgba\\(20\\,28\\,45\\,0\\.98\\)\\,rgba\\(17\\,24\\,39\\,0\\.94\\)\\)\\] {
            background: linear-gradient(180deg, rgba(255,251,247,0.94), rgba(255,244,236,0.9)) !important;
        }
        html.light .meera-page-wrapper .bg-\\[\\#050816\\] { background-color: #fff7ed !important; }
        html.light .meera-page-wrapper .bg-\\[linear-gradient\\(180deg\\,rgba\\(15\\,23\\,42\\,0\\.78\\)\\,rgba\\(15\\,23\\,42\\,0\\.62\\)\\)\\] {
            background: linear-gradient(180deg, rgba(255,252,248,0.86), rgba(255,245,238,0.66)) !important;
        }
        html.light .meera-page-wrapper .shadow-\\[0_18px_50px_-24px_rgba\\(15\\,23\\,42\\,0\\.95\\)\\] {
            box-shadow: 0 24px 60px -34px rgba(148,163,184,0.36) !important;
        }
        html.light .meera-page-wrapper .shadow-\\[0_30px_80px_-40px_rgba\\(15\\,23\\,42\\,0\\.85\\)\\] {
            box-shadow: 0 26px 70px -38px rgba(148,163,184,0.26) !important;
        }
        .meera-page-wrapper .meera-dock-shell {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(10,16,30,0.74);
          box-shadow: 0 24px 64px -32px rgba(2,6,23,0.92);
          backdrop-filter: blur(30px) saturate(155%);
          -webkit-backdrop-filter: blur(30px) saturate(155%);
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .meera-page-wrapper .meera-dock-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: transparent;
        }
        .meera-page-wrapper .meera-dock-shell::after {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: inherit;
        }
        html.light .meera-page-wrapper .meera-dock-shell {
          border-color: rgba(255,255,255,0.58) !important;
          background:
            linear-gradient(180deg, rgba(255,252,248,0.94), rgba(255,244,236,0.82)),
            radial-gradient(circle at 18% 0%, rgba(14,165,233,0.14), transparent 34%),
            radial-gradient(circle at 85% 120%, rgba(132,204,22,0.12), transparent 28%) !important;
          box-shadow:
            0 24px 60px -34px rgba(148,163,184,0.38),
            inset 0 1px 0 rgba(255,255,255,0.86),
            inset 0 -1px 0 rgba(255,255,255,0.32) !important;
        }
        html.light .meera-page-wrapper .meera-dock-shell::before {
          background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.18)) !important;
        }
        html.light .meera-page-wrapper .meera-dock-shell::after {
          border-color: rgba(148,163,184,0.16) !important;
        }
      `}} />
      <div className="meera-page-wrapper relative overflow-hidden bg-[#050816] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_82%_15%,rgba(56,189,248,0.16),transparent_18%),radial-gradient(circle_at_82%_85%,rgba(132,204,22,0.12),transparent_22%),linear-gradient(180deg,#07101f_0%,#050816_45%,#06101a_100%)]" />
          <div className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-4rem] h-[24rem] w-[24rem] rounded-full bg-lime-400/10 blur-3xl" />
          <div className="absolute left-[-10rem] top-[40%] h-[32rem] w-[32rem] rounded-full bg-sky-500/5 blur-[120px]" />
        </div>

        <div className="sticky top-4 z-40 mx-auto mt-4 hidden w-[min(104rem,calc(100vw-12rem))] px-4 lg:block">
          <GlassPanel className="meera-dock-shell mx-auto flex w-full items-center justify-between gap-4 rounded-full px-5 py-3 sm:px-6">
            <div className="relative z-10 flex items-center gap-4">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <MeeraAIDockBrand />
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 justify-end">
              {sectionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-sky-300/30 hover:bg-white/[0.08] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </GlassPanel>
        </div>

        <section className="px-4 pb-10 pt-20 sm:px-6 sm:pb-14 sm:pt-24 lg:px-10 lg:pb-12 lg:pt-16 xl:px-12" onMouseMove={handleHeroPointer} onMouseLeave={resetHeroPointer}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={sectionInnerClass}
          >
            <GlassPanel className="relative overflow-hidden rounded-[1.65rem] border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.62))] px-3.5 py-3.5 sm:rounded-[2rem] sm:px-5 sm:py-5 lg:px-6 lg:py-6">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),transparent_38%,rgba(132,204,22,0.1))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(125,211,252,0.16),transparent_20%),radial-gradient(circle_at_84%_18%,rgba(14,165,233,0.12),transparent_18%),radial-gradient(circle_at_80%_86%,rgba(190,242,100,0.12),transparent_20%)]" />
              <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: heroGlow }} />

              <div className="relative grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-8">
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div className="space-y-4 sm:space-y-5">
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.24em] text-sky-200 sm:px-3 sm:text-[0.58rem] sm:tracking-[0.3em]">
                        <span className="h-2 w-2 rounded-full bg-sky-300" />
                        Desktop-first local AI
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.52rem] font-bold uppercase tracking-[0.24em] text-slate-300 sm:px-3 sm:text-[0.58rem] sm:tracking-[0.3em]">
                        <Gauge className="h-3 w-3 text-lime-200" />
                        Seven curated model profiles
                      </div>
                    </div>

                    <div className="space-y-3.5 sm:space-y-4">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.34em] text-sky-300/80 sm:text-[0.62rem] sm:tracking-[0.44em]">
                        A personal AI desktop app
                      </p>
                      <h1 className="max-w-[19ch] text-[clamp(1.8rem,2.6vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-white">
                        MeeraAI brings your{' '}
                        <span className="bg-gradient-to-r from-sky-200 via-white to-lime-200 bg-clip-text text-transparent">
                          assistant and browser together
                        </span>
                        .
                      </h1>
                      <p className="max-w-xl text-[0.86rem] leading-6 text-slate-300 sm:text-[0.9rem] sm:leading-7">
                        Chat with local models, work with documents, manage coding tasks, and browse with a page-aware assistant. Built with React, Electron, and Python.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 0px rgba(56, 189, 248, 0)',
                            '0 0 26px rgba(56, 189, 248, 0.35)',
                            '0 0 0px rgba(56, 189, 248, 0)',
                          ],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="rounded-full"
                      >
                        <Button asChild size="lg" className="h-9 rounded-full bg-sky-500 px-4 text-sm text-white hover:bg-sky-400 sm:h-10 sm:px-5">
                          <a href={meeraAIDownloads.frontend.href} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                            Main App Source
                          </a>
                        </Button>
                      </motion.div>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-9 rounded-full border-white/12 bg-white/[0.03] px-4 text-sm text-white hover:bg-white/10 hover:text-white sm:h-10 sm:px-5"
                      >
                        <a href={meeraAIDownloads.installer.href} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                          Installer Source
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {heroSignals.map((signal, index) => (
                      <motion.div
                        key={signal.title}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1 + index * 0.06 }}
                        whileHover={allowMotion ? { y: -6 } : undefined}
                        className="rounded-[1.1rem] border border-white/10 bg-slate-950/35 p-3 shadow-[0_24px_64px_-46px_rgba(2,6,23,0.95)] sm:rounded-[1.25rem] sm:p-3.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] border border-white/10 bg-white/[0.05] text-sky-200 sm:h-10 sm:w-10 sm:rounded-[0.9rem]">
                          <signal.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                        <h3 className="mt-2.5 text-[0.88rem] font-semibold tracking-tight text-white sm:mt-3 sm:text-[0.95rem]">{signal.title}</h3>
                        <p className="mt-1.5 text-[0.78rem] leading-[1.15rem] text-slate-300 sm:text-[0.82rem] sm:leading-5">{signal.text}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {quickStats.map((stat) => (
                      <motion.div
                        key={stat.label}
                        whileHover={allowMotion ? { y: -6, borderColor: 'rgba(125, 211, 252, 0.35)' } : undefined}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="rounded-[1rem] border border-white/10 bg-slate-950/35 px-3 py-2.5 sm:rounded-[1.1rem] sm:px-3.5 sm:py-3"
                      >
                        <div className="text-[0.92rem] font-semibold text-white sm:text-[0.98rem]">{stat.value}</div>
                        <div className="mt-1 text-[0.64rem] leading-4 text-slate-400 sm:text-[0.72rem]">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
                    <div className="absolute -right-4 bottom-10 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl" />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    style={allowMotion ? { x: dashboardX, y: dashboardY } : undefined}
                    className="relative space-y-2.5 sm:space-y-3"
                  >
                    <div className="relative">
                      <ScreenshotCard
                        src={screenshots.welcome}
                        alt="MeeraAI main workspace with the prompt composer"
                        caption="Main workspace / prompt composer and suggested prompts."
                        className="overflow-hidden rounded-[1.8rem] self-start"
                        frameClassName="aspect-[2.25/1] min-h-[11rem] sm:min-h-[13rem] lg:aspect-[2.8/1] lg:min-h-0"
                        imageClassName="p-0 object-contain object-center"
                        priority
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.25 }}
                        className="absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-[0.5rem] font-bold uppercase tracking-[0.22em] text-sky-200 shadow-[0_18px_40px_-22px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:left-3 sm:top-3 sm:px-3 sm:text-[0.55rem] sm:tracking-[0.32em]"
                      >
                        Desktop app
                      </motion.div>
                      <motion.button
                        type="button"
                        onClick={() => setFocusItem(productJourney[0])}
                        whileHover={allowMotion ? { y: -3 } : undefined}
                        className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1.5 text-[0.74rem] font-medium text-white shadow-[0_18px_40px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl transition-colors hover:border-sky-300/30 hover:text-sky-200 sm:bottom-3 sm:left-3 sm:px-3.5 sm:py-2 sm:text-[0.82rem]"
                      >
                        Explore the app
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {heroPreviewCards.map((card) => (
                        <HeroPreviewTile
                          key={card.id}
                          eyebrow={card.eyebrow}
                          title={card.title}
                          text={card.text}
                          image={card.image}
                          alt={card.alt}
                          accentClassName={card.accentClassName}
                          allowMotion={allowMotion}
                          onClick={() =>
                            setFocusItem({
                              id: card.id,
                              title: card.title,
                              body: card.body,
                              image: card.image,
                              alt: card.alt,
                              caption: card.caption,
                            })
                          }
                        />
                      ))}
                    </div>
                  </motion.div>

                </div>
              </div>

              <div className="relative mt-3 flex flex-col gap-3 rounded-[1.05rem] border border-white/10 bg-slate-950/40 px-3 py-3 lg:mt-4 lg:flex-row lg:items-center lg:justify-between lg:rounded-[1.2rem] lg:px-3.5 lg:py-3.5">
                <div className="flex flex-wrap gap-2.5">
                  {heroFlow.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.18 + index * 0.05 }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[0.66rem] font-medium text-slate-200 shadow-[0_18px_46px_-34px_rgba(2,6,23,0.95)] sm:px-3 sm:text-[0.72rem]"
                    >
                      <item.icon className="h-3 w-3 text-sky-200" />
                      <span>{item.label}</span>
                    </motion.div>
                  ))}
                </div>
                <Link
                  href="#lineup"
                  className="inline-flex items-center gap-2 text-[0.78rem] font-semibold text-sky-200 transition-colors hover:text-white sm:text-[0.84rem]"
                >
                  See the runtime map
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        </section>

        <section id="screenshots" className={sectionOuterClass}>
          <div className={sectionInnerClass}>
            <SectionTitle
              eyebrow="Inside the app"
              title="The current MeeraAI interface."
              body="A guided visual walkthrough of the desktop app and browser. It plays through each screen in sequence; pause it, jump to a screen, or open the original image."
            />
            <ScreenshotSequence
              allowMotion={allowMotion}
              onOpen={(shot) => setFocusItem({ ...shot })}
            />
          </div>
        </section>

        <section id="lineup" className={sectionOuterClass}>
          <ScrollBlock className={cn(sectionInnerClass, 'space-y-6 sm:space-y-8')}>
            <SectionTitle
              eyebrow="Model Lineup"
              title="Seven profiles. The models behind each one."
              body="These are the current chat profiles and backend model mappings. Model Studio calls Meera and Vision Pro and Max. Tier roles describe intended use; vision and tool reliability have not been benchmarked across every model."
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {lineupFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3.5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.9)] sm:rounded-[1.25rem] sm:py-4"
                >
                  <p className="text-[1.65rem] font-semibold tracking-tight text-white sm:text-2xl">{fact.value}</p>
                  <p className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-[0.72rem] sm:tracking-[0.28em]">
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(10,15,28,0.9))] p-1 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.95)] backdrop-blur-3xl sm:mt-8 sm:rounded-[2rem]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(132,204,22,0.1),transparent_20%),linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.18))]" />

              <div className="relative z-10 space-y-4 p-3 sm:p-4 lg:p-5">
                <div className="flex flex-col gap-4 rounded-[1.45rem] border border-white/8 bg-white/[0.03] px-4 py-4 backdrop-blur-xl sm:rounded-[1.85rem] sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
                  <div className="max-w-2xl">
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.28em] text-sky-300/80 sm:text-[0.64rem] sm:tracking-[0.36em]">Tier Board</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      Nano through Ultra, with the selected model and quantization.
                    </h3>
                    <p className="mt-3 text-[0.9rem] leading-6 text-slate-300 sm:text-sm sm:leading-7">
                      These interface profiles are not evaluated model releases. Open a card to review the limits of available evidence.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {modelLineup.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onMouseEnter={() => setHoveredTier(model.id)}
                        onFocus={() => setHoveredTier(model.id)}
                        onClick={() => setHoveredTier(model.id)}
                        className={cn(
                          'rounded-full border px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition sm:px-3 sm:text-[0.68rem] sm:tracking-[0.28em]',
                          activeTier.id === model.id
                            ? 'border-white/20 bg-white/[0.12] text-white'
                            : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/16 hover:text-white'
                        )}
                      >
                        {model.name.replace('Meera ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {modelLineup.map((model, index) => {
                    const isActive = activeTier.id === model.id;

                    return (
                      <motion.button
                        key={model.id}
                        type="button"
                        whileHover={allowMotion ? { y: -8, scale: 1.01 } : undefined}
                        whileTap={allowMotion ? { scale: 0.99 } : undefined}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        onMouseEnter={() => setHoveredTier(model.id)}
                        onFocus={() => setHoveredTier(model.id)}
                        onClick={() => setFocusItem({
                          id: model.id,
                          title: `${model.name} Technical Profile`,
                          body: `${model.detail}\n\nBackend quantization policy: ${model.vram}. Model: ${model.architecture}. Intended role: ${model.capability}. Configured pathways: ${model.pathways}. Hardware fit and end-to-end capability are not established by a profile label.`,
                          image: screenshots.logo,
                          alt: model.name,
                          caption: `Architecture: ${model.architecture}`
                        })}
                        className={cn(
                          'group relative overflow-hidden rounded-[1.25rem] border p-4 text-left shadow-[0_30px_90px_-55px_rgba(15,23,42,0.95)] backdrop-blur-2xl sm:rounded-[1.25rem] sm:p-4',
                          isActive
                            ? 'border-white/18 bg-slate-950/40'
                            : 'border-white/10 bg-slate-950/20 hover:border-white/16 hover:bg-slate-950/28'
                        )}
                        style={isActive ? { boxShadow: `0 35px 110px -58px ${model.glow}` } : undefined}
                      >
                        <div className={cn('absolute inset-0 opacity-90', model.accent)} />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.45)_60%,rgba(15,23,42,0.9))]" />
                        <div
                          className={cn(
                            'absolute inset-0 transition-opacity duration-300',
                            isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-75'
                          )}
                          style={{ background: `radial-gradient(circle at top, ${model.glow}, transparent 48%)` }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: model.glow }} />

                        <div className="relative flex h-full min-h-[12rem] flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[0.56rem] font-black uppercase tracking-[0.28em] text-sky-200/80 sm:text-[0.62rem] sm:tracking-[0.42em]">
                                Tier 0{index + 1}
                              </div>
                              <div className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                {model.name.replace('Meera ', '')}
                              </div>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-white/12 bg-slate-950/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-8 sm:w-8">
                              <model.icon className="h-4 w-4" />
                            </div>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-300">
                            {model.architecture}
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-[0.75rem] border border-white/10 bg-slate-950/28 px-2.5 py-2.5 backdrop-blur-xl">
                              <div className="text-[0.52rem] font-black uppercase tracking-[0.24em] text-white/35 sm:text-[0.56rem] sm:tracking-[0.34em]">Quantization</div>
                              <div className="mt-1.5 text-xs font-semibold leading-5 text-white">{model.vram}</div>
                            </div>
                            <div className="rounded-[0.75rem] border border-white/10 bg-slate-950/22 px-2.5 py-2.5 backdrop-blur-xl">
                              <div className="text-[0.52rem] font-black uppercase tracking-[0.24em] text-white/35 sm:text-[0.56rem] sm:tracking-[0.34em]">Role</div>
                              <div className="mt-1.5 text-xs font-semibold leading-5 text-white">{model.capability}</div>
                            </div>
                          </div>

                          <div className="mt-auto pt-3">
                            <div className="flex items-center justify-between rounded-[0.75rem] border border-white/10 bg-white/[0.05] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-xl sm:text-[0.62rem] sm:tracking-[0.2em]">
                              <span>Inspect Tier</span>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

              </div>

              <div className="border-t border-white/5 bg-slate-950/40 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-10">
                <p className="text-[0.56rem] font-bold uppercase tracking-[0.3em] text-slate-400/80 sm:text-[0.62rem] sm:tracking-[0.45em]">
                  Current model profiles from Nano through Ultra; configured roles are not benchmark scores.
                </p>
              </div>
            </motion.div>
          </ScrollBlock>
        </section>

        <section id="features" className={sectionOuterClass}>
          <ScrollBlock className={sectionInnerClass}>
            <SectionTitle
              eyebrow="Core Features"
              title="What you can work with in MeeraAI."
              body="The current source includes model management, browsing, documents, tools, and controlled coding work. The detailed capabilities and testing status are listed below."
            />

            <div className="relative mt-16 flex min-h-[420px] flex-col items-center justify-center sm:min-h-[500px] lg:min-h-[600px]">
              <FeatureDeck features={coreFeatures} />
            </div>
          </ScrollBlock>
        </section>

        <MeeraAICapabilities />

        <section id="flow" className={sectionOuterClass}>
          <ScrollBlock className={cn(sectionInnerClass, 'space-y-6 sm:space-y-8')}>
            <SectionTitle
              eyebrow="Product Flow"
              title="The desktop app and Meera Browser."
              body="Explore the current app workflow. The screenshots show the main workspace, browser, agentic terminal, and Control Center. Open any image to see it at full size."
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.62))] shadow-2xl backdrop-blur-3xl sm:mt-12 sm:rounded-[2.5rem]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),transparent_38%,rgba(132,204,22,0.08))]" />

              <div className="relative z-10 p-5 sm:p-7 lg:p-14">
                <div className="grid grid-cols-1 gap-7 sm:gap-10 md:grid-cols-2 lg:gap-16">
                  {productJourney.map((item, index) => {
                    const isHovered = hoveredFlowId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="group"
                      >
                        <div
                          className="relative cursor-pointer"
                          onClick={() => setFocusItem(item)}
                          onMouseEnter={() => setHoveredFlowId(item.id)}
                          onMouseLeave={() => setHoveredFlowId(null)}
                        >
                          <motion.div
                            layoutId={`feature-card-${item.id}`}
                            className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900 shadow-2xl transition-all duration-500 group-hover:border-sky-400/30"
                          >
                            <ScreenshotCard
                              src={item.image}
                              alt={item.alt}
                              caption={item.caption}
                              className="h-full border-none shadow-none"
                              imageClassName="p-0 object-contain object-center"
                              animateImageOnLoad
                            />
                          </motion.div>

                          <div className="mt-5 space-y-2.5 px-1 sm:mt-8 sm:space-y-3 sm:px-2">
                            <div className="flex items-center gap-3">
                              <div className="h-px w-8 bg-sky-500/50 transition-all duration-500 group-hover:w-14 group-hover:bg-sky-400" />
                              <span className="text-[0.58rem] font-black uppercase tracking-[0.26em] text-sky-400/80 sm:text-[0.65rem] sm:tracking-[0.4em]">
                                Phase 0{index + 1}
                              </span>
                            </div>
                            <h3 className="text-[1.15rem] font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-sky-300 sm:text-2xl">
                              {item.title}
                            </h3>
                            <p className="line-clamp-2 text-[0.84rem] leading-6 text-slate-400 sm:text-[0.9rem] sm:leading-7">
                              {item.body.split('\n\n')[0]}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.22em] text-sky-400 opacity-0 transition-opacity group-hover:opacity-100 sm:mt-4 sm:text-xs sm:tracking-widest">
                              Research Details
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Research Footer Bar */}
              <div className="border-t border-white/5 bg-slate-950/40 px-5 py-4 sm:px-8 sm:py-5 lg:px-14">
                <p className="text-[0.56rem] font-bold uppercase tracking-[0.3em] text-slate-400/80 sm:text-[0.62rem] sm:tracking-[0.45em]">
                  A consolidated journey from initial entry to engine-level hardware configuration.
                </p>
              </div>
            </motion.div>
          </ScrollBlock>
        </section>

        <section className={sectionOuterClass}>
          <ScrollBlock className={cn(sectionInnerClass, 'space-y-10')}>
            <SectionTitle
              eyebrow="LLMs, Quantization, And Inference"
              title="How the application runs models and tools."
              body="The model runtime, browser workspace, and automation services have different responsibilities. Here is how they fit together and what has been checked."
            />
            <div className="grid items-stretch gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <GlassPanel className="relative overflow-hidden border-white/8 bg-slate-900/55 p-5 shadow-[0_40px_90px_-45px_rgba(2,6,23,0.95)] sm:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(96,165,250,0.16),transparent_18%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/5" />
                <div className="relative mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.34em] text-sky-300/80">Focus Signal</p>
                    <p className="mt-1 text-sm text-slate-400">{inferenceNotes[activeInferenceIndex]?.title}</p>
                  </div>
                  <div className="flex gap-2">
                    {inferenceNotes.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        aria-label={`Focus ${item.title}`}
                        onClick={() => setActiveInferenceIndex(index)}
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          activeInferenceIndex === index ? 'w-8 bg-lime-300' : 'w-2 bg-white/15 hover:bg-white/30'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="relative space-y-3">
                  {technicalPoints.map((point, index) => (
                    (() => {
                      const focusedIndexes = technicalFocusMap[activeInferenceIndex] as readonly number[] | undefined;
                      const isHighlighted = focusedIndexes?.includes(index);
                      return (
                    <motion.div
                      key={point}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={allowMotion ? { x: 6, scale: 1.01 } : undefined}
                      animate={
                        allowMotion
                          ? {
                            opacity: isHighlighted ? 1 : 0.62,
                            scale: isHighlighted ? 1.004 : 1,
                            x: isHighlighted ? 3 : 0,
                          }
                          : {
                            opacity: isHighlighted ? 1 : 0.72,
                          }
                      }
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      className={cn(
                        'group rounded-[1.15rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-300',
                        isHighlighted
                          ? 'border-lime-300/20 bg-[#10172a] shadow-[0_18px_40px_-28px_rgba(190,242,100,0.45)]'
                          : 'border-white/8 bg-[#0d1222]/88 hover:border-sky-300/20 hover:bg-[#10172a]'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveInferenceIndex(technicalPointToInferenceIndex[index] ?? 0)}
                        onMouseEnter={() => setActiveInferenceIndex(technicalPointToInferenceIndex[index] ?? 0)}
                        onFocus={() => setActiveInferenceIndex(technicalPointToInferenceIndex[index] ?? 0)}
                        className="block w-full text-left"
                      >
                      <p className="text-[0.92rem] font-medium leading-7 text-slate-200 sm:text-[0.98rem]">
                        {point}
                      </p>
                      </button>
                    </motion.div>
                      );
                    })()
                  ))}
                </div>
              </GlassPanel>

              <div className="grid gap-4 sm:grid-cols-2">
                {inferenceNotes.map(({ title, text, icon: Icon }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={allowMotion ? { y: -4 } : undefined}
                    animate={
                      allowMotion
                        ? {
                          opacity: activeInferenceIndex === index ? 1 : 0.72,
                          scale: activeInferenceIndex === index ? 1.015 : 0.985,
                        }
                        : { opacity: activeInferenceIndex === index ? 1 : 0.78 }
                    }
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="h-full"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveInferenceIndex(index)}
                      onMouseEnter={() => setActiveInferenceIndex(index)}
                      onFocus={() => setActiveInferenceIndex(index)}
                      className="h-full w-full text-left"
                    >
                    <GlassPanel className={cn(
                      'group relative flex h-full min-h-[14.5rem] flex-col overflow-hidden p-6 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.95)] transition-all duration-300 sm:p-7',
                      activeInferenceIndex === index
                        ? 'border-lime-300/20 bg-[linear-gradient(180deg,rgba(20,28,45,0.98),rgba(17,24,39,0.95))] shadow-[0_30px_90px_-38px_rgba(125,211,252,0.28)]'
                        : 'border-white/8 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(15,23,42,0.92))] hover:border-lime-300/18 hover:bg-[linear-gradient(180deg,rgba(20,28,45,0.98),rgba(17,24,39,0.94))]'
                    )}>
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-80"
                        animate={
                          allowMotion
                            ? {
                              background: [
                                'radial-gradient(circle at 78% 28%, rgba(125,211,252,0.16), transparent 22%)',
                                'radial-gradient(circle at 70% 36%, rgba(125,211,252,0.22), transparent 24%)',
                                'radial-gradient(circle at 78% 28%, rgba(125,211,252,0.16), transparent 22%)',
                              ],
                              opacity: activeInferenceIndex === index ? 1 : 0.45,
                            }
                            : undefined
                        }
                        transition={{
                          duration: 8 + index,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <div className="relative flex h-full flex-col">
                        <motion.div
                          className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-lime-300/18 bg-lime-300/8 text-lime-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          animate={allowMotion ? { y: [0, -2, 0], scale: [1, 1.03, 1] } : undefined}
                          whileHover={allowMotion ? { scale: 1.08, rotate: 3 } : undefined}
                          transition={{
                            duration: 4.5 + index * 0.35,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        <div className="mt-5 flex items-center justify-between gap-4">
                          <h3 className="text-[1rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.05rem]">
                          {title}
                          </h3>
                          <span className={cn(
                            'text-[0.62rem] font-bold uppercase tracking-[0.28em] transition-colors',
                            activeInferenceIndex === index ? 'text-lime-200' : 'text-white/30'
                          )}>
                            {activeInferenceIndex === index ? 'Focused' : 'Inspect'}
                          </span>
                        </div>
                        <motion.p
                          className="mt-4 text-[0.88rem] leading-8 text-slate-300 sm:text-[0.92rem]"
                          initial={{ opacity: 0.86 }}
                          whileHover={allowMotion ? { opacity: 1 } : undefined}
                        >
                          {text}
                        </motion.p>
                      </div>
                    </GlassPanel>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollBlock>
        </section>

        <section id="engineering" className={sectionOuterClass}>
          <ScrollBlock className={sectionInnerClass}>
            <HoverTilt>
              <GlassPanel className="min-h-[31rem] overflow-hidden p-5 sm:min-h-[36rem] sm:p-10 lg:min-h-[40rem] lg:p-12">
                <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
                  <div className="flex h-full flex-col justify-center space-y-5 sm:space-y-6">
                    <div className="flex justify-center pt-2">
                      <div className="relative flex h-[13rem] w-[13rem] items-center justify-center rounded-full border border-sky-300/20 bg-white/[0.04] shadow-[0_28px_70px_-42px_rgba(56,189,248,0.3)] sm:h-[15rem] sm:w-[15rem] lg:h-[17rem] lg:w-[17rem]">
                        <div className="absolute inset-4 rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.14),transparent_58%)]" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.12),transparent_30%)]" />
                        <div className="relative flex h-[10.4rem] w-[10.4rem] items-center justify-center overflow-hidden rounded-full border border-white/12 bg-white/[0.06] p-2.5 backdrop-blur-sm sm:h-[12rem] sm:w-[12rem] lg:h-[13.5rem] lg:w-[13.5rem] lg:p-3">
                          <Image
                            src={avatarImage?.imageUrl || '/something/hacker.png'}
                            alt={avatarImage?.description || 'Developer avatar'}
                            width={420}
                            height={420}
                            className="h-full w-full rounded-full object-contain"
                            sizes="(max-width: 1024px) 280px, 320px"
                          />
                        </div>
                      </div>
                    </div>

                    <SectionTitle
                      eyebrow="About The Developer"
                      title="About the developer"
                      body="I am Vidit Shah, the developer of MeeraAI. This section is about my work on local AI inference, model deployment flow, quantization-aware decisions, and desktop application structure."
                    />
                  </div>

                  <div className="flex h-full flex-col space-y-3.5 sm:space-y-4">
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-10 top-24 hidden h-[28rem] w-[32rem] rounded-full blur-[120px] lg:block"
                      animate={
                        allowMotion
                          ? {
                              y: [0, 18, -12, 0],
                              opacity: [0.12, 0.2, 0.16, 0.12],
                            }
                          : undefined
                      }
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        background:
                          activeEngineeringIndex === 4
                            ? 'radial-gradient(circle, rgba(56,189,248,0.24), transparent 65%)'
                            : 'radial-gradient(circle, rgba(96,165,250,0.18), transparent 65%)',
                      }}
                    />
                    {engineeringSignals.map((point, index) => (
                      <motion.div
                        key={point}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        animate={
                          allowMotion
                            ? {
                              opacity: activeEngineeringIndex === index ? 1 : 0.62,
                              x: activeEngineeringIndex === index ? 14 : 0,
                              y:
                                activeEngineeringIndex === index
                                  ? -4
                                  : activeEngineeringIndex < index
                                    ? 3
                                    : 0,
                              scale: activeEngineeringIndex === index ? 1.02 : 0.985,
                              filter: activeEngineeringIndex === index ? 'blur(0px)' : 'blur(0.8px)',
                            }
                            : undefined
                        }
                        transition={{ duration: 0.32, ease: 'easeOut', delay: index * 0.05 }}
                        className={cn(
                          'relative overflow-hidden rounded-[1.15rem] border px-4 py-3.5 text-[0.88rem] leading-6 transition-all duration-300 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm sm:leading-7',
                          activeEngineeringIndex === index
                            ? 'border-sky-300/25 bg-[linear-gradient(90deg,rgba(56,189,248,0.12),rgba(255,255,255,0.05))] text-white shadow-[0_24px_60px_-40px_rgba(56,189,248,0.4)]'
                            : 'border-white/10 bg-white/[0.04] text-slate-200'
                        )}
                        onMouseEnter={() => setActiveEngineeringIndex(index)}
                        onFocus={() => setActiveEngineeringIndex(index)}
                      >
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-sky-300"
                          animate={
                            allowMotion
                              ? {
                                  opacity: activeEngineeringIndex === index ? 1 : 0,
                                  x: activeEngineeringIndex === index ? 0 : -8,
                                  scaleY: activeEngineeringIndex === index ? 1 : 0.7,
                                }
                              : undefined
                          }
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                        />
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0"
                          animate={
                            allowMotion && activeEngineeringIndex === index
                              ? {
                                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }
                              : undefined
                          }
                          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                          style={{
                            backgroundImage:
                              activeEngineeringIndex === index
                                ? 'linear-gradient(110deg, transparent 0%, rgba(125,211,252,0.06) 38%, rgba(125,211,252,0.16) 50%, transparent 64%)'
                                : 'transparent',
                            backgroundSize: '220% 100%',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/0"
                          animate={
                            allowMotion
                              ? {
                                  opacity: activeEngineeringIndex === index ? 1 : 0,
                                  clipPath:
                                    activeEngineeringIndex === index
                                      ? 'inset(0% 0% 0% 0% round 1rem)'
                                      : 'inset(0% 100% 0% 0% round 1rem)',
                                }
                              : undefined
                          }
                          transition={{ duration: 0.38, ease: 'easeOut' }}
                          style={{
                            backgroundImage:
                              'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02) 48%, transparent 75%)',
                          }}
                        />
                        <button
                          type="button"
                          className="relative block w-full text-left"
                          onClick={() => setActiveEngineeringIndex(index)}
                        >
                          <motion.span
                            className="block"
                            animate={
                              allowMotion
                                ? {
                                    x: activeEngineeringIndex === index ? 0 : -6,
                                    opacity: activeEngineeringIndex === index ? 1 : 0.82,
                                  }
                                : undefined
                            }
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                          >
                            {point}
                          </motion.span>
                        </button>
                      </motion.div>
                    ))}

                    <motion.div
                      className="mt-2 flex flex-col gap-4 rounded-[1.3rem] border border-sky-400/20 bg-sky-400/10 p-4 sm:mt-4 sm:rounded-[1.75rem] sm:p-6 sm:flex-row sm:items-center sm:justify-between"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      whileHover={{ y: -4, borderColor: 'rgba(125, 211, 252, 0.35)' }}
                      animate={allowMotion ? { scale: activeEngineeringIndex === 4 ? 1.012 : 1 } : undefined}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      <div>
                        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-sky-200/80 sm:text-sm sm:tracking-[0.24em]">Next Step</p>
                        <p className="mt-2 max-w-xl text-[0.88rem] leading-6 text-slate-200 sm:text-sm sm:leading-7">
                          {meeraSummary.nextStep}
                        </p>
                      </div>
                      <Button asChild className="rounded-xl bg-white text-slate-950 hover:bg-slate-100">
                        <Link href="/meeraai/download">
                          Open Build Guide
                          <motion.span
                            animate={allowMotion ? { x: [0, 5, 0], scale: [1, 1.05, 1] } : undefined}
                            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
                            className="inline-flex"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.span>
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </GlassPanel>
            </HoverTilt>
          </ScrollBlock>
        </section>

        <section id="feedback" className="px-4 pb-36 pt-14 sm:px-6 sm:pb-36 lg:px-8 lg:pb-44 lg:pt-20">
          <ScrollBlock className={sectionInnerClass}>
            <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <HoverTilt>
                <GlassPanel className="relative h-full min-h-[24rem] overflow-hidden p-5 sm:min-h-[28rem] sm:p-10">
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    animate={
                      allowMotion
                        ? {
                            backgroundImage: [
                              'radial-gradient(circle at 28% 30%, rgba(56,189,248,0.08), transparent 28%)',
                              'radial-gradient(circle at 36% 52%, rgba(56,189,248,0.13), transparent 30%)',
                              'radial-gradient(circle at 28% 30%, rgba(56,189,248,0.08), transparent 28%)',
                            ],
                          }
                        : undefined
                    }
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="relative text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-300/80 sm:text-xs sm:tracking-[0.28em]"
                  >
                    Suggestion Area
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="relative mt-3 text-[1.8rem] font-semibold tracking-tight text-white sm:mt-4 sm:text-4xl"
                  >
                    Suggestion area
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="relative mt-4 text-[0.92rem] leading-7 text-slate-300 sm:mt-5 sm:text-base sm:leading-8"
                  >
                    People who write suggestions here can send feature requests, issue reports, and improvement ideas. The
                    submitted suggestion will be mailed to me directly.
                  </motion.p>

                  <div className="relative mt-6 space-y-3 sm:mt-8">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.35, delay: 0.16 }}
                      animate={
                        allowMotion
                          ? {
                              opacity: activeSuggestionIndex === 0 ? 1 : activeSuggestionIndex === null ? 1 : 0.68,
                              x: activeSuggestionIndex === 0 ? 12 : 0,
                              scale: activeSuggestionIndex === 0 ? 1.018 : 0.988,
                              filter: activeSuggestionIndex === 0 || activeSuggestionIndex === null ? 'blur(0px)' : 'blur(0.8px)',
                            }
                          : undefined
                      }
                      className={cn(
                        'relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition-all duration-300',
                        activeSuggestionIndex === 0
                          ? 'border-sky-300/25 bg-[linear-gradient(90deg,rgba(56,189,248,0.1),rgba(255,255,255,0.04))] text-white shadow-[0_24px_60px_-42px_rgba(56,189,248,0.32)]'
                          : 'border-white/10 bg-slate-950/35 text-slate-200'
                      )}
                      onMouseEnter={() => setActiveSuggestionIndex(0)}
                      onFocus={() => setActiveSuggestionIndex(0)}
                      onMouseLeave={() => setActiveSuggestionIndex(null)}
                    >
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        animate={
                          allowMotion && activeSuggestionIndex === 0
                            ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                            : undefined
                        }
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                        style={{
                          backgroundImage:
                            activeSuggestionIndex === 0
                              ? 'linear-gradient(110deg, transparent 0%, rgba(125,211,252,0.06) 38%, rgba(125,211,252,0.16) 50%, transparent 64%)'
                              : 'transparent',
                          backgroundSize: '220% 100%',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit]"
                        animate={
                          allowMotion
                            ? {
                                opacity: activeSuggestionIndex === 0 ? 1 : 0,
                                clipPath:
                                  activeSuggestionIndex === 0
                                    ? 'inset(0% 0% 0% 0% round 1rem)'
                                    : 'inset(0% 100% 0% 0% round 1rem)',
                              }
                            : undefined
                        }
                        transition={{ duration: 0.38, ease: 'easeOut' }}
                        style={{
                          backgroundImage:
                            'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02) 48%, transparent 75%)',
                        }}
                      />
                      <motion.p
                        className="relative"
                        animate={
                          allowMotion
                            ? {
                                x: activeSuggestionIndex === 0 ? 0 : -6,
                                opacity: activeSuggestionIndex === 0 || activeSuggestionIndex === null ? 1 : 0.82,
                              }
                            : undefined
                        }
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                      >
                        Share a missing workflow you want inside the app.
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.35, delay: 0.22 }}
                      animate={
                        allowMotion
                          ? {
                              opacity: activeSuggestionIndex === 1 ? 1 : activeSuggestionIndex === null ? 1 : 0.68,
                              x: activeSuggestionIndex === 1 ? 12 : 0,
                              scale: activeSuggestionIndex === 1 ? 1.018 : 0.988,
                              filter: activeSuggestionIndex === 1 || activeSuggestionIndex === null ? 'blur(0px)' : 'blur(0.8px)',
                            }
                          : undefined
                      }
                      className={cn(
                        'relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition-all duration-300',
                        activeSuggestionIndex === 1
                          ? 'border-sky-300/25 bg-[linear-gradient(90deg,rgba(56,189,248,0.1),rgba(255,255,255,0.04))] text-white shadow-[0_24px_60px_-42px_rgba(56,189,248,0.32)]'
                          : 'border-white/10 bg-slate-950/35 text-slate-200'
                      )}
                      onMouseEnter={() => setActiveSuggestionIndex(1)}
                      onFocus={() => setActiveSuggestionIndex(1)}
                      onMouseLeave={() => setActiveSuggestionIndex(null)}
                    >
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        animate={
                          allowMotion && activeSuggestionIndex === 1
                            ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                            : undefined
                        }
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                        style={{
                          backgroundImage:
                            activeSuggestionIndex === 1
                              ? 'linear-gradient(110deg, transparent 0%, rgba(125,211,252,0.06) 38%, rgba(125,211,252,0.16) 50%, transparent 64%)'
                              : 'transparent',
                          backgroundSize: '220% 100%',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit]"
                        animate={
                          allowMotion
                            ? {
                                opacity: activeSuggestionIndex === 1 ? 1 : 0,
                                clipPath:
                                  activeSuggestionIndex === 1
                                    ? 'inset(0% 0% 0% 0% round 1rem)'
                                    : 'inset(0% 100% 0% 0% round 1rem)',
                              }
                            : undefined
                        }
                        transition={{ duration: 0.38, ease: 'easeOut' }}
                        style={{
                          backgroundImage:
                            'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02) 48%, transparent 75%)',
                        }}
                      />
                      <motion.p
                        className="relative"
                        animate={
                          allowMotion
                            ? {
                                x: activeSuggestionIndex === 1 ? 0 : -6,
                                opacity: activeSuggestionIndex === 1 || activeSuggestionIndex === null ? 1 : 0.82,
                              }
                            : undefined
                        }
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                      >
                        Report friction in setup, hardware detection, or runtime clarity.
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.35, delay: 0.28 }}
                      animate={
                        allowMotion
                          ? {
                              opacity: activeSuggestionIndex === 2 ? 1 : activeSuggestionIndex === null ? 1 : 0.68,
                              x: activeSuggestionIndex === 2 ? 12 : 0,
                              scale: activeSuggestionIndex === 2 ? 1.018 : 0.988,
                              filter: activeSuggestionIndex === 2 || activeSuggestionIndex === null ? 'blur(0px)' : 'blur(0.8px)',
                            }
                          : undefined
                      }
                      className={cn(
                        'relative overflow-hidden rounded-2xl border px-4 py-4 text-sm transition-all duration-300',
                        activeSuggestionIndex === 2
                          ? 'border-sky-300/25 bg-[linear-gradient(90deg,rgba(56,189,248,0.1),rgba(255,255,255,0.04))] text-white shadow-[0_24px_60px_-42px_rgba(56,189,248,0.32)]'
                          : 'border-white/10 bg-slate-950/35 text-slate-200'
                      )}
                      onMouseEnter={() => setActiveSuggestionIndex(2)}
                      onFocus={() => setActiveSuggestionIndex(2)}
                      onMouseLeave={() => setActiveSuggestionIndex(null)}
                    >
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        animate={
                          allowMotion && activeSuggestionIndex === 2
                            ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
                            : undefined
                        }
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
                        style={{
                          backgroundImage:
                            activeSuggestionIndex === 2
                              ? 'linear-gradient(110deg, transparent 0%, rgba(125,211,252,0.06) 38%, rgba(125,211,252,0.16) 50%, transparent 64%)'
                              : 'transparent',
                          backgroundSize: '220% 100%',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[inherit]"
                        animate={
                          allowMotion
                            ? {
                                opacity: activeSuggestionIndex === 2 ? 1 : 0,
                                clipPath:
                                  activeSuggestionIndex === 2
                                    ? 'inset(0% 0% 0% 0% round 1rem)'
                                    : 'inset(0% 100% 0% 0% round 1rem)',
                              }
                            : undefined
                        }
                        transition={{ duration: 0.38, ease: 'easeOut' }}
                        style={{
                          backgroundImage:
                            'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(56,189,248,0.02) 48%, transparent 75%)',
                        }}
                      />
                      <motion.p
                        className="relative"
                        animate={
                          allowMotion
                            ? {
                                x: activeSuggestionIndex === 2 ? 0 : -6,
                                opacity: activeSuggestionIndex === 2 || activeSuggestionIndex === null ? 1 : 0.82,
                              }
                            : undefined
                        }
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                      >
                        Suggest model handling improvements for future Meera tiers.
                      </motion.p>
                    </motion.div>
                  </div>
                </GlassPanel>
              </HoverTilt>

              <SuggestionForm />
            </div>
          </ScrollBlock>
        </section>

        <AnimatePresence>
          {focusItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-8 lg:p-12"
            >
              <div
                className="fixed inset-0 bg-slate-950/78 backdrop-blur-2xl"
                onClick={closeFocusItem}
              />

              <motion.div
                layoutId={`feature-card-${focusItem.id}`}
                className="relative z-10 grid max-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 text-card-foreground shadow-[0_40px_120px_-40px_rgba(15,23,42,0.68)] backdrop-blur-2xl lg:grid-cols-[1.35fr_0.98fr]"
                transition={{ type: 'spring', stiffness: 45, damping: 15 }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_22%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.08),transparent_22%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/5 dark:border-white/8" />
                <div
                  className="relative min-h-[18rem] cursor-zoom-out overflow-hidden bg-slate-950/86 lg:min-h-[38rem]"
                  onClick={closeFocusItem}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(125,211,252,0.14),transparent_36%),linear-gradient(180deg,rgba(2,6,23,0.22),rgba(2,6,23,0.5))]" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-px bg-border/70 lg:block" />
                  <Image
                    src={focusItem.image}
                    alt={focusItem.alt}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.18 }}
                  className="relative flex h-full min-h-[18rem] flex-col justify-between overflow-y-auto border-t border-border/60 bg-background/55 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-12"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(56,189,248,0.1),transparent_24%)]" />
                  <div className="relative space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.34em] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      Feature Analysis
                    </div>
                    <h2 className="max-w-[16ch] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      {focusItem.title}
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {focusItem.caption}
                    </p>
                    <div className="space-y-5 text-[0.95rem] leading-relaxed text-muted-foreground sm:text-base">
                      {focusItem.body.split('\n\n').map((para, i) => (
                        <p key={i} className="opacity-95">{para}</p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={closeFocusItem}
                    className="group relative mt-8 inline-flex items-center gap-3 font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    <ArrowRight className="h-5 w-5 rotate-180 transition-transform group-hover:-translate-x-1" />
                    <span>Back to feature journey</span>
                  </button>
                </motion.div>

                <button
                  onClick={closeFocusItem}
                  aria-label="Close feature popup"
                  className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 bg-slate-950/90 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.8)] backdrop-blur-md transition hover:bg-slate-900 dark:border-white/10 dark:bg-slate-950/86 dark:hover:bg-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div >
    </>
  );
}
