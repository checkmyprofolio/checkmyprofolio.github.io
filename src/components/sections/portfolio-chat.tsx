'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bot, ExternalLink, Github, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { streamPortfolioQuestion, type PortfolioStreamEvent } from '@/lib/portfolio-local-assistant';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  mode?: 'verified-response' | 'portfolio';
  notice?: string;
  sources?: string[];
};

const welcome: Message = {
  role: 'assistant',
  content: `# What’s up 👋

## Welcome to my portfolio
- 🤖 Ask me about **my projects and engineering work**.
- 🧠 Ask about **MeeraAI, local AI, robotics, or software systems**.
- 🎓 Ask about **my education, skills, and engineering background**.
- 📫 Ask for my **public contact details**.

---

I’ll talk to you like **Vidit**, not like a support bot — and I’ll keep the technical details grounded in what’s actually documented here.`,
};

const prompts = [
  '🧠 What is MeeraAI?',
  '👋 Tell me about Vidit',
  '🚀 What have I built?',
  '💻 What are my skills?',
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
    if (paragraph.length) blocks.push(<p key={`p-${blocks.length}`} className="leading-6"><InlineMarkdown text={paragraph.join(' ')} /></p>);
    if (bullets.length) blocks.push(<ul key={`ul-${blocks.length}`} className="space-y-1.5 pl-5">{bullets.map((x, i) => <li key={i} className="list-disc leading-6"><InlineMarkdown text={x} /></li>)}</ul>);
    if (numbers.length) blocks.push(<ol key={`ol-${blocks.length}`} className="space-y-1.5 pl-5">{numbers.map((x, i) => <li key={i} className="list-decimal leading-6"><InlineMarkdown text={x} /></li>)}</ol>);
    paragraph = []; bullets = []; numbers = [];
  };

  const pushTable = () => {
    if (!table.length) return;
    const rows = table.filter((r) => r.trim()).map((r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    const clean = rows.filter((r, i) => !(i === 1 && r.every((c) => /^:?-{2,}:?$/.test(c))));
    if (clean.length) {
      blocks.push(<div key={`table-${blocks.length}`} className="overflow-x-auto rounded-xl border border-slate-500/15 dark:border-white/10"><table className="min-w-full text-left text-xs"><tbody>{clean.map((row, ri) => <tr key={ri} className={ri === 0 ? 'border-b border-slate-500/15 bg-slate-500/5 dark:border-white/10 dark:bg-white/[0.03]' : 'border-b last:border-b-0 border-slate-500/10 dark:border-white/5'}>{row.map((cell, ci) => ri === 0 ? <th key={ci} className="px-3 py-2 font-semibold"><InlineMarkdown text={cell} /></th> : <td key={ci} className="px-3 py-2 align-top"><InlineMarkdown text={cell} /></td>)}</tr>)}</tbody></table></div>);
    }
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

  if (code !== null) blocks.push(<pre key="code-final" className="overflow-x-auto rounded-xl border border-slate-500/15 bg-slate-950/5 p-3 text-xs dark:border-white/10 dark:bg-black/25"><code>{code.join('\n')}</code></pre>);
  flush(); pushTable();

  return <div className="space-y-3 text-sm text-foreground">{blocks}</div>;
}

function SourceList({ sources = [] }: { sources?: string[] }) {
  if (!sources.length) return null;
  return <div className="mt-4 border-t border-slate-500/10 pt-3 dark:border-white/10">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"><ExternalLink className="h-3 w-3" /> Sources &amp; evidence</div>
    <div className="flex flex-wrap gap-1.5">
      {sources.map((source, index) => {
        const href = source.startsWith('http') ? source : source.startsWith('/') ? source : undefined;
        return href ? <a key={`${source}-${index}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="rounded-full border border-primary/15 bg-primary/[0.045] px-2.5 py-1 text-[10px] text-primary transition-colors hover:bg-primary/10">{source.startsWith('/') ? source.replace(/^\//, '') : source.replace(/^https?:\/\//, '')}</a> : <span key={`${source}-${index}`} className="rounded-full border border-slate-500/10 bg-slate-500/[0.035] px-2.5 py-1 text-[10px] text-muted-foreground">{source}</span>;
      })}
    </div>
  </div>;
}

function ThinkingPanel({ events }: { events: PortfolioStreamEvent[] }) {
  return <div className="mb-4 overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.035]">
    <div className="flex items-center gap-2 border-b border-primary/10 px-3 py-2.5">
      <div className="relative h-2 w-2"><span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" /><span className="relative block h-2 w-2 rounded-full bg-primary" /></div>
      <span className="text-xs font-semibold text-primary">Thinking</span>
      <span className="text-[10px] text-muted-foreground">I’m checking my portfolio evidence…</span>
    </div>
    <div className="px-3 py-2.5 font-mono text-[10px] leading-4 text-muted-foreground">
      {(events.length ? events.slice(-5) : [{ event: 'retrieval', data: 'Preparing my verified portfolio context…' } as PortfolioStreamEvent]).map((event, index) => <div key={`${event.event}-${index}`} className="flex items-start gap-2"><span className="shrink-0 text-primary">{event.event}</span><span className="truncate">{event.data}</span></div>)}
    </div>
    <div className="portfolio-thinking-shimmer h-[2px] w-full" />
    <style jsx>{`\n      .portfolio-thinking-shimmer {\n        background: linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 25%, hsl(var(--primary) / 0.65) 50%, hsl(var(--primary) / 0.08) 75%, transparent 100%);\n        background-size: 220% 100%;\n        animation: portfolioShimmer 1.65s linear infinite;\n      }\n      @keyframes portfolioShimmer {\n        from { background-position: 220% 0; }\n        to { background-position: -220% 0; }\n      }\n    `}</style>
  </div>;
}

export function PortfolioChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [streamEvents, setStreamEvents] = useState<PortfolioStreamEvent[]>([]);
  const [error, setError] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const sending = useRef(false);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy, streamEvents, draftAnswer]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending.current || question.length > 2000) return;
    sending.current = true;
    const history: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(history);
    setInput('');
    setBusy(true);
    setLoadingModel(false);
    setStreamEvents([]);
    setDraftAnswer('');
    setError('');

    try {
      const data = await streamPortfolioQuestion(question, (event) => {
        setStreamEvents((events) => [...events.slice(-7), event]);
        if (event.event === 'model-loading') setLoadingModel(true);
        if (event.event === 'token') { setLoadingModel(false); setDraftAnswer((prev) => prev + event.data); }
      });
      setMessages([...history, { role: 'assistant', content: data.answer, mode: data.mode, notice: data.notice, sources: data.sources }]);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'I hit a local error. Try that again.');
      setInput(question);
      setMessages(history.slice(0, -1));
    } finally {
      sending.current = false;
      setBusy(false);
      setLoadingModel(false);
      setDraftAnswer('');
    }
  }

  return <>
    <div className="flex items-center justify-between border-b border-slate-500/10 bg-white/20 px-5 py-4 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/15 p-2.5 text-primary"><Bot className="h-6 w-6" /></div>
        <div><h2 className="font-headline font-bold">Ask my portfolio</h2><p className="text-xs text-muted-foreground">Vidit Shah · Projects &amp; engineering</p></div>
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
            {message.role === 'assistant' ? <RichMarkdown content={message.content} /> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>}
            {message.mode && <p className="mt-3 text-[11px] text-muted-foreground/80">{message.mode === 'verified-response' ? 'Verified portfolio answer' : 'Portfolio answer'} · Evidence constrained</p>}
            {message.notice && <p className="mt-2 text-xs text-muted-foreground">{message.notice}</p>}
            {message.sources && <SourceList sources={message.sources} />}
          </div>
        </div>)}

        {busy && <div className="flex justify-start"><div className="w-full max-w-[92%]"><ThinkingPanel events={streamEvents} />{draftAnswer && <div className="rounded-2xl rounded-bl-sm border border-white/50 bg-white/45 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"><RichMarkdown content={draftAnswer} /></div>}</div></div>}
      </div>

      {messages.length === 1 && <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)} disabled={busy} className="flex items-center justify-between gap-2 rounded-2xl border border-white/50 bg-white/30 px-3 py-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/10 dark:border-white/10 dark:bg-white/[0.035]">{prompt}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /></button>)}</div>}
      <div ref={end} />
    </div>

    <div className="shrink-0 border-t border-slate-500/10 bg-white/25 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-white/10 dark:bg-white/[0.025]">
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex items-end gap-2">
        <label htmlFor="portfolio-question" className="sr-only">Your question</label>
        <Textarea id="portfolio-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={2} placeholder="Ask me about a project or about me..." className="min-h-[60px] max-h-32 resize-none rounded-2xl border-white/50 bg-white/50 focus-visible:ring-primary/40 dark:border-white/15 dark:bg-slate-950/30" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }} />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question" className="mb-1 h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-primary/20"><Send className="h-4 w-4" /></Button>
      </form>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Github className="h-3 w-3" />On-device portfolio chat · verified evidence · no made-up facts.</p>
    </div>
  </>;
}
