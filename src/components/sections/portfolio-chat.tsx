'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bot, Github, Loader2, RotateCcw, Send, X } from 'lucide-react';
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
  content: "Hi, I’m Vidit’s portfolio assistant. Ask about his projects, engineering work, education, skills, or public contact details. I only discuss information verified by this portfolio.",
};

const prompts = ['What is MeeraAI?', 'Tell me about Vidit', 'What has he built?', 'What are his skills?'];

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

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy, streamEvents, draftAnswer]);

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
        if (event.event !== 'model-loading') {
          setStreamEvents((events) => [...events.slice(-7), event]);
        }
        if (event.event === 'model-loading') setLoadingModel(true);
        if (event.event === 'token') {
          setLoadingModel(false);
          setDraftAnswer((prev) => prev + event.data);
        }
      });
      setMessages([...history, {
        role: 'assistant',
        content: data.answer,
        mode: data.mode,
        notice: data.notice,
        sources: data.sources,
      }]);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Unable to answer that question. Please try again.');
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
          <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border border-white/50 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/[0.055]'}`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.mode && <p className="mt-3 text-[11px] opacity-70">{message.mode === 'verified-response' ? 'Verified portfolio answer' : 'Portfolio answer'} · {message.sources?.join(' + ')}</p>}
            {message.notice && <p className="mt-2 text-xs opacity-70">{message.notice}</p>}
          </div>
        </div>)}

        {busy && draftAnswer && (
          <div className="flex justify-start">
            <div className="max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed rounded-bl-sm border border-white/50 bg-white/45 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
              <p className="whitespace-pre-wrap break-words">{draftAnswer}<span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse" /></p>
            </div>
          </div>
        )}

        {busy && <div className="space-y-2" role="status">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{loadingModel ? 'Loading the on-device model…' : 'Streaming local portfolio events…'}</div>
          {!draftAnswer && (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.045] px-3 py-2 font-mono text-[10px] leading-4 text-muted-foreground">
              {streamEvents.map((event, index) => <p key={`${event.event}-${index}`}><span className="mr-1 text-primary">event:{event.event}</span>{event.data}</p>)}
            </div>
          )}
        </div>}
      </div>

      {messages.length === 1 && <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)} disabled={busy} className="flex items-center justify-between gap-2 rounded-2xl border border-white/50 bg-white/30 px-3 py-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/10 dark:border-white/10 dark:bg-white/[0.035]">{prompt}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /></button>)}</div>}
      <div ref={end} />
    </div>

    <div className="shrink-0 border-t border-slate-500/10 bg-white/25 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-white/10 dark:bg-white/[0.025]">
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex items-end gap-2">
        <label htmlFor="portfolio-question" className="sr-only">Your question</label>
        <Textarea id="portfolio-question" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={2} placeholder="Ask about a project or about me..." className="min-h-[60px] max-h-32 resize-none rounded-2xl border-white/50 bg-white/50 focus-visible:ring-primary/40 dark:border-white/15 dark:bg-slate-950/30" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }} />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question" className="mb-1 h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-primary/20"><Send className="h-4 w-4" /></Button>
      </form>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Github className="h-3 w-3" />On-device event stream · source-verified portfolio answers · unrelated questions declined.</p>
    </div>
  </>;
}
