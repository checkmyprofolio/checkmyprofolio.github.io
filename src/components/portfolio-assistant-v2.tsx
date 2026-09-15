'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as webllm from '@mlc-ai/web-llm';

type Message = { id: number; role: 'user' | 'assistant'; content: string };

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const CONTEXT_WINDOW = 1024;
const SYSTEM_PROMPT = `You are the public portfolio assistant for Vidit Shah. Answer only from these verified facts and the conversation. Never invent employers, awards, metrics, projects, URLs, or current-student status.

IDENTITY: Vidit Shah is a Robotics & AI Engineer. He completed a B.E. in Robotics & Automation in 2026 at Government Engineering College, Sector-28, Gandhinagar, Gujarat Technological University (GTU). Final CGPA: 8.45/10.

CURRICULUM: Programming for Problem Solving; Mathematics I; Mathematics II; Complex Variables & Partial Differential Equations; Numerical Methods; Automatic Control Systems; Principles of Robotics; Microcontrollers & PLC; Machine Vision Systems; Soft Computing.

PROJECTS: MeeraAI local-first desktop AI stack using Electron, TypeScript and Python, with local language models and RAG/tooling; AarnaAI stock-market prediction system using TensorFlow/scikit-learn and historical market data; AIRLearn AI/Robotics learning platform with chatbot, Firebase and Next.js; AI CCTV Surveillance computer-vision work; YouTube Music Automation Tool in Python; ESP32 IoT/home-office automation; Binance Futures Testnet CLI in Python; Gemini Web2API integration; Profolio portfolio platform.

TECHNICAL SKILLS: Python, C++, TypeScript, JavaScript, PyTorch, TensorFlow, Keras, scikit-learn, LLMs, RAG, LoRA/QLoRA, OpenCV, GGUF, llama.cpp, FastAPI, React, Next.js, Electron, Vite, SQLite, REST APIs, SSE, Docker, Linux, Git, robotics, control systems, PLCs, microcontrollers and automation.`;

const starters = [
  'Give me a deep technical overview of Vidit.',
  'Explain MeeraAI and its architecture.',
  'What did Vidit study and how does it map to AI/robotics?',
  'What are his strongest engineering skills?'
];

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]*\))/g).filter(Boolean);
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : p.startsWith('`') ? <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-cyan-200">{p.slice(1,-1)}</code> : p.startsWith('[') ? (() => { const m=p.match(/^\[([^\]]+)\]\(([^)]+)\)$/); return m ? <a key={i} href={m[2]} target="_blank" rel="noreferrer" className="text-cyan-300 underline">{m[1]}</a> : p; })() : p)}</>;
}

function Markdown({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.replace(/\r/g,'').split('\n');
    const out: { kind: string; text?: string; items?: string[]; code?: string }[] = [];
    let para: string[] = [], bullets: string[] = [], numbers: string[] = [], code: string[] | null = null;
    const flush = () => { if (para.length) out.push({kind:'p',text:para.join(' ')}); if (bullets.length) out.push({kind:'ul',items:[...bullets]}); if (numbers.length) out.push({kind:'ol',items:[...numbers]}); para=[]; bullets=[]; numbers=[]; };
    for (const line of lines) {
      const t=line.trim();
      if (code !== null) { if (t.startsWith('```')) { out.push({kind:'code',code:code.join('\n')}); code=null; } else code.push(line); continue; }
      if (t.startsWith('```')) { flush(); code=[]; continue; }
      const h=t.match(/^(#{1,3})\s+(.+)/); if (h) { flush(); out.push({kind:`h${h[1].length}`,text:h[2]}); continue; }
      const b=t.match(/^[-*]\s+(.+)/); if (b) { if (para.length||numbers.length) flush(); bullets.push(b[1]); continue; }
      const n=t.match(/^\d+\.\s+(.+)/); if (n) { if (para.length||bullets.length) flush(); numbers.push(n[1]); continue; }
      if (!t) { flush(); continue; }
      para.push(t);
    }
    if (code !== null) out.push({kind:'code',code:code.join('\n')});
    flush(); return out;
  }, [content]);
  return <div className="space-y-3 text-sm leading-6 text-slate-200">{blocks.map((b,i) => {
    if (b.kind==='h1') return <h3 key={i} className="text-xl font-bold text-white"><Inline text={b.text||''}/></h3>;
    if (b.kind==='h2') return <h4 key={i} className="text-lg font-semibold text-cyan-100"><Inline text={b.text||''}/></h4>;
    if (b.kind==='h3') return <h5 key={i} className="font-semibold text-white"><Inline text={b.text||''}/></h5>;
    if (b.kind==='ul') return <ul key={i} className="space-y-1 pl-5">{b.items?.map((x,j)=><li key={j} className="list-disc"><Inline text={x}/></li>)}</ul>;
    if (b.kind==='ol') return <ol key={i} className="space-y-1 pl-5">{b.items?.map((x,j)=><li key={j} className="list-decimal"><Inline text={x}/></li>)}</ol>;
    if (b.kind==='code') return <pre key={i} className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-cyan-100"><code>{b.code}</code></pre>;
    return <p key={i}><Inline text={b.text||''}/></p>;
  })}</div>;
}

export function PortfolioAssistantV2() {
  const [open,setOpen]=useState(false), [input,setInput]=useState(''), [messages,setMessages]=useState<Message[]>([]), [ready,setReady]=useState(false), [loading,setLoading]=useState(false), [status,setStatus]=useState('Waiting for local GPU…'), [gpu,setGpu]=useState<boolean|null>(null), [copied,setCopied]=useState<number|null>(null);
  const engine=useRef<webllm.MLCEngineInterface|null>(null); const id=useRef(1);
  useEffect(()=>{ setGpu(typeof navigator!=='undefined' && 'gpu' in navigator); },[]);
  useEffect(()=>{
    if(!open || gpu!==true || engine.current) return;
    let cancelled=false;
    setStatus(`Loading ${MODEL_ID}…`);
    void webllm.CreateMLCEngine(MODEL_ID,{logLevel:'WARN',initProgressCallback:r=>{if(!cancelled)setStatus(r.text||'Loading local model…')}},{context_window_size:CONTEXT_WINDOW})
      .then(e=>{if(cancelled)return;engine.current=e;setReady(true);setStatus(`Local LLM ready · ${CONTEXT_WINDOW}-token context`);})
      .catch(e=>{if(!cancelled)setStatus(`Model error: ${e instanceof Error?e.message:'initialization failed'}`);});
    return ()=>{cancelled=true};
  },[open,gpu]);
  async function restart(){ if(!engine.current)return; setReady(false); setStatus('Restarting LLM with 1024-token context…'); try{await engine.current.reload(MODEL_ID,{context_window_size:CONTEXT_WINDOW});setReady(true);setStatus(`Restarted · ${CONTEXT_WINDOW}-token context`);}catch(e){setStatus(`Restart failed: ${e instanceof Error?e.message:'unknown error'}`);setReady(false);} }
  async function ask(q:string){const text=q.trim();if(!text||loading||!ready||!engine.current)return;const user:Message={id:id.current++,role:'user',content:text};setMessages(m=>[...m,user]);setInput('');setLoading(true);const assistantId=id.current++;setMessages(m=>[...m,user,{id:assistantId,role:'assistant',content:''}]);try{const history=[...messages,user].slice(-6).map(m=>({role:m.role,content:m.content}));const stream=await engine.current.chat.completions.create({messages:[{role:'system',content:SYSTEM_PROMPT},...history],temperature:0.35,top_p:0.9,max_tokens:384,stream:true});let answer='';for await(const chunk of stream){const d=chunk.choices[0]?.delta?.content||'';if(!d)continue;answer+=d;setMessages(m=>m.map(x=>x.id===assistantId?{...x,content:answer}:x));}}catch(e){setMessages(m=>m.map(x=>x.id===assistantId?{...x,content:`## Assistant error\n\n${e instanceof Error?e.message:'The local model failed.'}`}:x));}finally{setLoading(false);}}
  async function copy(text:string,msgId:number){try{await navigator.clipboard.writeText(text);setCopied(msgId);setTimeout(()=>setCopied(null),1200)}catch{}}
  return <>
    {!open && <button onClick={()=>setOpen(true)} className="fixed bottom-6 right-6 z-[180] rounded-full border border-cyan-300/25 bg-slate-950/95 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_70px_-20px_rgba(34,211,238,.35)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/60">✦ Ask Vidit’s AI</button>}
    {open && <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-3 backdrop-blur-2xl sm:p-6">
      <section className="flex h-[min(880px,94vh)] w-[min(1180px,100%)] flex-col overflow-hidden rounded-[32px] border border-white/15 bg-[#070b12]/98 shadow-[0_50px_160px_-50px_rgba(0,0,0,.95)]">
        <header className="flex items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="grid size-11 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xl">✦</div>
          <div className="mr-auto"><div className="text-sm font-bold tracking-wide text-white">Vidit AI</div><div className="text-xs text-slate-500">Local portfolio intelligence · WebLLM · Qwen 0.5B · {CONTEXT_WINDOW}-token context</div></div>
          <button onClick={restart} disabled={!ready||loading} className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40">↻ Restart LLM</button>
          <button onClick={()=>setOpen(false)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/5" aria-label="Close">×</button>
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[290px_1fr]">
          <aside className="hidden border-r border-white/10 bg-white/[.02] p-5 lg:block">
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Runtime</div><div className="mt-3 flex items-center gap-2 text-sm text-white"><span className={`size-2 rounded-full ${ready?'bg-emerald-400':'bg-amber-400'}`}/>{status}</div><div className="mt-3 text-xs leading-5 text-slate-500">Browser GPU: {gpu===true?'WebGPU detected':'checking'}<br/>Model stays in the browser cache after download.</div></div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Try asking</div><div className="mt-3 space-y-2">{starters.map(s=><button key={s} onClick={()=>void ask(s)} disabled={!ready||loading} className="w-full rounded-xl border border-white/8 bg-white/[.025] p-3 text-left text-xs leading-5 text-slate-300 hover:border-cyan-300/25 hover:bg-cyan-300/5 disabled:opacity-40">{s}</button>)}</div>
          </aside>
          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
              {!messages.length && <div className="mx-auto flex max-w-3xl flex-col justify-center py-16 text-center"><div className="mx-auto grid size-16 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-2xl text-cyan-200">AI</div><h3 className="mt-5 text-2xl font-bold text-white sm:text-3xl">Ask about Vidit’s engineering work.</h3><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">This assistant runs locally in your browser with WebGPU. Responses are grounded in the portfolio facts embedded in the local system prompt.</p>{gpu===false && <div className="mx-auto mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs text-amber-200">WebGPU is unavailable in this browser/device. Use a current Chromium-based browser with hardware acceleration enabled.</div>}{gpu===true&&!ready&&<div className="mx-auto mt-5 max-w-md text-xs text-slate-500">{status}</div>}</div>}
              <div className="mx-auto max-w-3xl space-y-5">{messages.map(m=><div key={m.id} className={m.role==='user'?'flex justify-end':'flex justify-start'}><div className={m.role==='user'?'max-w-[85%] rounded-2xl rounded-br-md bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 shadow-lg':'max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[.045] px-5 py-4'}>{m.role==='assistant'?<><Markdown content={m.content||'Thinking…'}/><div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2"><span className="text-[10px] text-slate-600">Local · Qwen 0.5B · 1024 context</span>{m.content&&<button onClick={()=>void copy(m.content,m.id)} className="text-[10px] text-slate-500 hover:text-white">{copied===m.id?'Copied':'Copy'}</button>}</div></>:m.content}</div></div>)}</div>
            </div>
            <div className="border-t border-white/10 p-4 sm:p-5"><form onSubmit={e=>{e.preventDefault();void ask(input)}} className="mx-auto flex max-w-3xl items-end gap-3"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void ask(input)}}} rows={2} placeholder={ready?'Ask about a project, skill, architecture, or education…':'Waiting for the local model…'} className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"/><button type="submit" disabled={!ready||loading||!input.trim()} className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cyan-400 text-xl text-slate-950 shadow-lg disabled:opacity-30">➤</button></form><div className="mx-auto mt-2 max-w-3xl text-[10px] text-slate-600">{status} · outputs capped at 384 tokens · conversations are kept in page memory only</div></div>
          </div>
        </div>
      </section>
    </div>}
  </>;
}
