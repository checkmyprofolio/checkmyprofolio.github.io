'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bot, ExternalLink, Github, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  streamPortfolioQuestion,
  checkPortfolioAI,
  MODEL_ID,
  type PortfolioCitation,
  type PortfolioStreamEvent,
} from '@/lib/portfolio-remote-assistant';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  mode?: 'model-generated' | 'scope' | 'error';
  notice?: string;
  sources?: PortfolioCitation[];
};

const welcome: Message = {
  role: 'assistant',
  content: `# Profolio AI

## Ask about Vidit's work

- Projects and engineering work
- MeeraAI, local AI, robotics, and software systems
- Education, skills, and engineering background
- Public portfolio and GitHub information
- Current technology news and external context when live search is relevant

Profolio AI is the portfolio's professional knowledge layer. It answers from current first-party sources and live web search when appropriate.`,
};

const prompts = [
  'What is MeeraAI?',
  'Tell me about Vidit',
  'What have I built?',
  'What are my skills?',
];

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]*\)|https?:\/\/[^\s]+)/g).filter(Boolean);
  return <>{parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded-md bg-slate-950/10 px-1.5 py-0.5 text-[0.9em] dark:bg-white/10">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{link[1]}</a>;
    if (/^https?:\/\//.test(part)) return <a key={index} href={part} target="_blank" rel="noreferrer" className="break-all text-primary underline underline-offset-2">{part}</a>;
    return <span key={index}>{part}</span>;
  })}</>;
}

function RichMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];
  let code: string[] | null = null;
  let table: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="leading-6">
          <InlineMarkdown text={paragraph.join(' ')} />
        </p>,
      );
      blocks.push(
        <div
          key={`p-rule-${blocks.length}`}
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-slate-400/20 to-transparent dark:via-white/10"
        />,
      );
    }
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-1.5 pl-5">
          {bullets.map((x, i) => (
            <li key={i} className="list-disc leading-6">
              <InlineMarkdown text={x} />
            </li>
          ))}
        </ul>,
      );
    }
    if (numbers.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="space-y-1.5 pl-5">
          {numbers.map((x, i) => (
            <li key={i} className="list-decimal leading-6">
              <InlineMarkdown text={x} />
            </li>
          ))}
        </ol>,
      );
    }
    paragraph = []; bullets = []; numbers = [];
  };

  const pushTable = () => {
    if (!table.length) return;
    const rows = table.filter(Boolean).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const clean = rows.filter((r, i) => !(i === 1 && r.every((c) => /^:?-{2,}:?$/.test(c))));
    if (clean.length) blocks.push(
      <div key={`table-${blocks.length}`} className="overflow-x-auto rounded-xl border border-slate-500/15 dark:border-white/10">
        <table className="min-w-full text-left text-xs"><tbody>{clean.map((row, ri) => <tr key={ri} className={ri === 0 ? 'border-b border-slate-500/15 bg-slate-500/5 dark:border-white/10 dark:bg-white/[0.03]' : 'border-b border-slate-500/10 last:border-b-0 dark:border-white/5'}>{row.map((cell, ci) => ri === 0 ? <th key={ci} className="px-3 py-2 font-semibold"><InlineMarkdown text={cell} /></th> : <td key={ci} className="px-3 py-2 align-top"><InlineMarkdown text={cell} /></td>)}</tr>)}</tbody></table>
      </div>
    );
    table = [];
  };

  lines.forEach((line, index) => {
    const t = line.trim();
    if (code !== null) {
      if (t.startsWith('```')) {
        blocks.push(<pre key={`code-${index}`} className="overflow-x-auto rounded-xl border border-slate-500/15 bg-slate-950/5 p-3 text-xs dark:border-white/10 dark:bg-black/25"><code>{code.join('\n')}</code></pre>);
        code = null;
      } else code.push(line);
      return;
    }
    if (t.startsWith('```')) { flush(); pushTable(); code = []; return; }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(t)) { flush(); pushTable(); blocks.push(<div key={`hr-${index}`} className="my-4 h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent" />); return; }
    const heading = t.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flush(); pushTable();
      const level = heading[1].length;
      const cls = level === 1 ? 'text-lg font-bold' : level === 2 ? 'text-base font-semibold text-primary' : 'text-sm font-semibold';
      blocks.push(level === 1 ? <h3 key={`h-${index}`} className={cls}><InlineMarkdown text={heading[2]} /></h3> : level === 2 ? <h4 key={`h-${index}`} className={cls}><InlineMarkdown text={heading[2]} /></h4> : <h5 key={`h-${index}`} className={cls}><InlineMarkdown text={heading[2]} /></h5>);
      return;
    }
    if (t.startsWith('|') || t.endsWith('|')) { flush(); table.push(t); return; }
    const bullet = t.match(/^[-*+]\s+(.+)$/); if (bullet) { if (paragraph.length || numbers.length) flush(); bullets.push(bullet[1]); return; }
    const number = t.match(/^\d+\.\s+(.+)$/); if (number) { if (paragraph.length || bullets.length) flush(); numbers.push(number[1]); return; }
    if (!t) { flush(); pushTable(); return; }
    paragraph.push(t);
  });
  if (code !== null) {
    const renderedCode = (code as string[]).join('\n');
    blocks.push(<pre key="code-final" className="overflow-x-auto rounded-xl border border-slate-500/15 bg-slate-950/5 p-3 text-xs dark:border-white/10 dark:bg-black/25"><code>{renderedCode}</code></pre>);
  }
  flush(); pushTable();
  return <div className="space-y-3 text-sm text-foreground">{blocks}</div>;
}

function CitationPill({ sources = [] }: { sources?: PortfolioCitation[] }) {
  const citations = [...new Map(
    sources
      .filter((source) => source?.url)
      .map((source) => [source.url, source]),
  ).values()];

  return (
    <details className="relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/10"
        aria-label={`View ${citations.length} sources consulted for this response`}
      >
        <ExternalLink className="h-3 w-3" />
        <span>{citations.length} source{citations.length === 1 ? '' : 's'}</span>
      </summary>
      <div className="absolute right-0 top-8 z-30 w-80 max-w-[82vw] rounded-2xl border border-white/60 bg-background/95 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Sources consulted
        </p>
        <div className="space-y-1.5">
          {(citations.length ? citations : [{
            url: 'https://checkmyprofolio.github.io/',
            title: 'Vidit Shah — published portfolio',
            kind: 'portfolio' as const,
          }]).map((source, index) => (
            <a
              key={`${source.url}-${index}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-500/10 bg-slate-500/[0.035] px-2.5 py-2 transition hover:border-primary/25 hover:bg-primary/5"
            >
              <span className="block text-[11px] font-medium text-foreground">
                {source.title}
              </span>
              <span className="mt-0.5 block break-all text-[10px] leading-4 text-muted-foreground">
                {new URL(source.url).hostname.replace(/^www\./, '')}
              </span>
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}

function AssistantHeader({ sources = [] }: { sources?: PortfolioCitation[] }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-slate-500/10 pb-2.5 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-2">
        <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Profolio AI
        </span>
        <span className="hidden text-[10px] text-muted-foreground/60 sm:inline">
          · live stream
        </span>
      </div>
      <div className="ml-auto">
        <CitationPill sources={sources} />
      </div>
    </div>
  );
}

function ThinkingPanel({ events, modelLoading }: { events: PortfolioStreamEvent[]; modelLoading: boolean }) {
  const visible = events.length ? events.slice(-5) : [{ event: 'retrieval', data: 'Preparing verified portfolio evidence…' } as PortfolioStreamEvent];
  return <div className="mb-4 overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.035]">
    <div className="flex items-center gap-2 border-b border-primary/10 px-3 py-2.5">
      <div className="relative h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" /><span className="relative block h-2 w-2 rounded-full bg-primary" /></div>
      <span className="text-xs font-semibold text-primary">Thinking</span>
      <span className="text-[10px] text-muted-foreground">{modelLoading ? 'Connecting to the remote model…' : 'Streaming the response live…'}</span>
    </div>
    <div className="px-3 py-2.5 font-mono text-[10px] leading-4 text-muted-foreground">{visible.map((event, index) => <div key={`${event.event}-${index}`} className="flex items-start gap-2"><span className="shrink-0 text-primary">{event.event}</span><span className="truncate">{event.data}</span></div>)}</div>
    <div className="portfolio-thinking-shimmer h-[2px] w-full" />
    <style jsx>{`@keyframes portfolioShimmer {from{background-position:220% 0}to{background-position:-220% 0}} .portfolio-thinking-shimmer{background:linear-gradient(90deg,transparent,hsl(var(--primary)/.08) 25%,hsl(var(--primary)/.7) 50%,hsl(var(--primary)/.08) 75%,transparent);background-size:220% 100%;animation:portfolioShimmer 1.6s linear infinite}`}</style>
  </div>;
}

export function PortfolioChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<'checking' | 'ready' | 'offline'>('checking');
  const [streamEvents, setStreamEvents] = useState<PortfolioStreamEvent[]>([]);
  const [error, setError] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');
  const [streamSources, setStreamSources] = useState<PortfolioCitation[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const tokenBuffer = useRef('');
  const tokenFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      if (tokenFlushTimer.current) clearTimeout(tokenFlushTimer.current);
    };
  }, []);

  const queueToken = (token: string) => {
    tokenBuffer.current += token;
    if (tokenFlushTimer.current) return;

    tokenFlushTimer.current = setTimeout(() => {
      const next = tokenBuffer.current;
      tokenBuffer.current = '';
      tokenFlushTimer.current = null;
      if (next) {
        setDraftAnswer((prev) => prev + next);
      }
      requestAnimationFrame(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }, 50);
  };

  useEffect(() => {
    let active = true;

    checkPortfolioAI().then((ok) => {
      if (!active) return;
      setModelReady(ok);
      setRemoteStatus(ok ? 'ready' : 'offline');
    });

    return () => {
      active = false;
    };
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending.current || question.length > 2000) return;
    sending.current = true;
    const history = [...messages, { role: 'user' as const, content: question }];
    setMessages(history);
    setInput('');
    setBusy(true);
    setModelLoading(true);
    setStreamEvents([]);
    tokenBuffer.current = '';
    if (tokenFlushTimer.current) {
      clearTimeout(tokenFlushTimer.current);
      tokenFlushTimer.current = null;
    }
    setDraftAnswer('');
    setStreamSources([]);
    setError('');
    try {
      const data = await streamPortfolioQuestion(question, (event) => {
        if (event.event !== 'token') {
          setStreamEvents((events) => [...events.slice(-7), event]);
        }
        if (event.event === 'model-loading') setModelLoading(true);
        if (event.event === 'model-ready') { setModelReady(true); setModelLoading(false); }
        if (event.event === 'token') {
          setModelLoading(false);
          queueToken(event.data);
        }
        if (event.event === 'citation') {
          try {
            const citation = JSON.parse(event.data) as PortfolioCitation;
            if (citation?.url) {
              setStreamSources((sources) => [
                ...sources.filter((source) => source.url !== citation.url),
                citation,
              ]);
            }
          } catch {
            // Ignore malformed citation metadata without interrupting generation.
          }
        }
      }, history.slice(0, -1));
      setMessages([...history, { role: 'assistant', content: data.answer, mode: data.mode, notice: data.notice, sources: data.sources }]);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'I hit a local model error.');
      setMessages(history.slice(0, -1));
      setInput(question);
    } finally {
      if (tokenFlushTimer.current) {
        clearTimeout(tokenFlushTimer.current);
        tokenFlushTimer.current = null;
      }
      const remainingTokens = tokenBuffer.current;
      tokenBuffer.current = '';
      if (remainingTokens) {
        setDraftAnswer((prev) => prev + remainingTokens);
      }
      sending.current = false;
      setBusy(false);
      setModelLoading(false);
      setDraftAnswer('');
    }
  }

  return <>
    <div className="flex items-center justify-between border-b border-slate-500/10 bg-white/20 px-5 py-4 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/15 p-2.5 text-primary"><Bot className="h-6 w-6" /></div>
        <div className="min-w-0"><h2 className="font-headline font-bold">Ask my portfolio</h2><p className="truncate text-xs text-muted-foreground">Vidit Shah · Projects &amp; engineering</p></div>
      </div>
      <div className="flex shrink-0">
        <Button variant="ghost" size="icon" disabled={busy} aria-label="Start a new conversation" onClick={() => { setMessages([welcome]); setError(''); setInput(''); setStreamEvents([]); }}><RotateCcw className="h-4 w-4" /></Button>
        {onClose && <Button variant="ghost" size="icon" aria-label="Close chat" onClick={onClose}><X className="h-5 w-5" /></Button>}
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" role="log" aria-live="polite" aria-label="Conversation">
      <div className="space-y-5">
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[92%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border border-white/50 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/[0.055]'}`}>
            {message.role === 'assistant' && <AssistantHeader sources={message.sources} />}
            {message.role === 'assistant' ? <RichMarkdown content={message.content} /> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>}
            {message.mode === 'model-generated' && <p className="mt-3 text-[11px] text-muted-foreground/80">Server-side response · tokens streamed live</p>}
            {message.mode === 'scope' && <p className="mt-3 text-[11px] text-muted-foreground/80">Portfolio-only scope</p>}
            {message.mode === 'error' && <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">Remote model response unavailable</p>}
            {message.notice && <p className="mt-2 text-xs text-muted-foreground">{message.notice}</p>}

          </div>
        </div>)}
        {busy && <div className="flex justify-start"><div className="w-full max-w-[92%]"><ThinkingPanel events={streamEvents} modelLoading={modelLoading} />{draftAnswer && <div className="rounded-2xl rounded-bl-sm border border-white/50 bg-white/45 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"><AssistantHeader sources={streamSources} /><RichMarkdown content={draftAnswer} /></div>}</div></div>}
      </div>

      {messages.length === 1 && <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)} disabled={busy} className="flex items-center justify-between gap-2 rounded-2xl border border-white/50 bg-white/30 px-3 py-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/10 dark:border-white/10 dark:bg-white/[0.035]">{prompt}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /></button>)}</div>}
      <div ref={end} />
    </div>

    <div className="shrink-0 border-t border-slate-500/10 bg-white/25 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-white/10 dark:bg-white/[0.025]">
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex items-end gap-2">
        <label htmlFor="portfolio-question" className="sr-only">Your question</label>
        <Textarea id="portfolio-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={2} placeholder="Ask about a project or about me..." className="min-h-[60px] max-h-32 resize-none rounded-2xl border-white/50 bg-white/50 focus-visible:ring-primary/40 dark:border-white/15 dark:bg-slate-950/30" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }} />
        <Button type="submit" size="icon" disabled={busy || !modelReady || !input.trim()} aria-label="Send question" className="mb-1 h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-primary/20"><Send className="h-4 w-4" /></Button>
      </form>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Github className="h-3 w-3" />
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            remoteStatus === 'ready'
              ? 'bg-emerald-500'
              : remoteStatus === 'checking'
                ? 'animate-pulse bg-amber-400'
                : 'bg-rose-500'
          }`}
          aria-hidden="true"
        />
        {busy
          ? 'Live server stream · generating…'
          : remoteStatus === 'checking'
            ? 'Checking AI gateway…'
            : remoteStatus === 'ready'
              ? `Server-side ${MODEL_ID} · web search + streaming`
              : 'Remote AI is offline'}
      </p>
    </div>
  </>;
}