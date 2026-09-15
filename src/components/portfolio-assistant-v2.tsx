'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as webllm from '@mlc-ai/web-llm';

type Message = { id: number; role: 'user' | 'assistant'; content: string };
const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const CONTEXT_WINDOW = 1024;
const SYSTEM_PROMPT = `You are the public portfolio assistant for Vidit Shah. Answer only from these verified facts and the conversation. Never invent employers, awards, metrics, projects, URLs, or current-student status.
IDENTITY: Vidit Shah is a Robotics & AI Engineer. He completed a B.E. in Robotics & Automation in 2026 at Government Engineering College, Sector-28, Gandhinagar, under Gujarat Technological University (GTU). Final CGPA: 8.45/10.
CURRICULUM: Programming for Problem Solving; Mathematics I; Mathematics II; Complex Variables & Partial Differential Equations; Numerical Methods; Automatic Control Systems; Principles of Robotics; Microcontrollers & PLC; Machine Vision Systems; Soft Computing.
PROJECTS: MeeraAI local-first desktop AI stack using Electron, TypeScript and Python, with local language models and RAG/tooling; AarnaAI stock-market prediction system using TensorFlow/scikit-learn and historical market data; AIRLearn AI/Robotics learning platform with chatbot, Firebase and Next.js; AI CCTV Surveillance computer-vision work; YouTube Music Automation Tool in Python; ESP32 IoT/home-office automation; Binance Futures Testnet CLI in Python; Gemini Web2API integration; Profolio portfolio platform.
TECHNICAL SKILLS: Python, C++, TypeScript, JavaScript, PyTorch, TensorFlow, Keras, scikit-learn, LLMs, RAG, LoRA/QLoRA, OpenCV, GGUF, llama.cpp, FastAPI, React, Next.js, Electron, Vite, SQLite, REST APIs, SSE, Docker, Linux, Git, robotics, control systems, PLCs, microcontrollers and automation.`;

function inline(text: string, key: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\((?:https?:\/\/|\/)[^)]+\))/g).filter(Boolean);
  return parts.map((part, i) => {
    const k = `${key}-${i}`;
    if (part.startsWith('**') || part.startsWith('__')) return <strong key={k} className="font-semibold text-white">{part.slice(2,-2)}</strong>;
    if (part.startsWith('`')) return <code key={k} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-cyan-200">{part.slice(1,-1)}</code>;
    if (part.startsWith('*') || part.startsWith('_')) return <em key={k} className="text-slate-100">{part.slice(1,-1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)$/);
    return link ? <a key={k} href={link[2]} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-2">{link[1]}</a> : <span key={k}>{part}</span>;
  });
}

function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.replace(/\r/g,'').split('\n');
    const out: Array<{type:string;text?:string;items?:string[];code?:string;lang?:string}> = [];
    let para:string[]=[]; let list:string[]=[]; let ordered:string[]=[]; let code:string[]|null=null; let lang='';
    const flush=()=>{ if(para.length) out.push({type:'p',text:para.join(' ')}); if(list.length) out.push({type:'ul',items:[...list]}); if(ordered.length) out.push({type:'ol',items:[...ordered]}); para=[]; list=[]; ordered=[]; };
    for(const raw of lines){ const t=raw.trim();
      if(code!==null){ if(t.startsWith('```')){out.push({type:'code',code:code.join('\n'),lang});code=null;lang='';} else code.push(raw); continue; }
      if(t.startsWith('```')){flush();code=[];lang=t.slice(3).trim();continue;}
      const h=t.match(/^(#{1,4})\s+(.+)$/); if(h){flush();out.push({type:`h${h[1].length}`,text:h[2]});continue;}
      const b=t.match(/^[-*+]\s+(.+)$/); if(b){if(para.length||ordered.length)flush();list.push(b[1]);continue;}
      const n=t.match(/^\d+[.)]\s+(.+)$/); if(n){if(para.length||list.length)flush();ordered.push(n[1]);continue;}
      if(!t){flush();continue;} para.push(t);
    }
    if(code!==null) out.push({type:'code',code:code.join('\n'),lang}); flush(); return out;
  },[text]);
  return <div className="space-y-2 text-[13px] leading-6 text-slate-200">{blocks.map((b,i)=>{
    if(b.type==='h1'||b.type==='h2'||b.type==='h3'||b.type==='h4'){ const size=b.type==='h1'?'text-lg':b.type==='h2'?'text-base':b.type==='h3'?'text-sm':'text-sm'; return <div key={i} className={`${size} font-semibold text-white`}>{inline(b.text||'',`h${i}`)}</div>; }
    if(b.type==='ul') return <ul key={i} className="space-y-1 pl-4">{b.items!.map((x,j)=><li key={j} className="list-disc marker:text-cyan-300">{inline(x,`u${i}-${j}`)}</li>)}</ul>;
    if(b.type==='ol') return <ol key={i} className="space-y-1 pl-5">{b.items!.map((x,j)=><li key={j} className="list-decimal marker:text-cyan-300">{inline(x,`o${i}-${j}`)}</li>)}</ol>;
    if(b.type==='code') return <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-black/30"><div className="border-b border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-[.16em] text-slate-500">{b.lang||'code'}</div><pre className="overflow-x-auto p-3 text-[11px] leading-5 text-cyan-100"><code>{b.code}</code></pre></div>;
    return <p key={i}>{inline(b.text||'',`p${i}`)}</p>;
  })}</div>;
}

const welcome = `I’m Vidit’s portfolio assistant. Ask me about **Vidit Shah**, his projects, education, engineering work, skills, or technical stack. I’ll keep answers grounded in the verified portfolio context.`;

export function PortfolioAssistantV2(){
  const [open,setOpen]=useState(false); const [input,setInput]=useState(''); const [messages,setMessages]=useState<Message[]>([{id:1,role:'assistant',content:welcome}]); const [ready,setReady]=useState(false); const [loading,setLoading]=useState(false); const [status,setStatus]=useState('Loading local AI…'); const [gpu,setGpu]=useState<boolean|null>(null); const [copied,setCopied]=useState<number|null>(null);
  const engine=useRef<webllm.MLCEngineInterface|null>(null); const nextId=useRef(2); const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setGpu(typeof navigator!=='undefined' && 'gpu' in navigator);},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{ if(!open||gpu!==true||engine.current)return; let cancelled=false; setStatus('Loading local AI…'); void webllm.CreateMLCEngine(MODEL_ID,{logLevel:'WARN',initProgressCallback:r=>{if(!cancelled)setStatus(r.text||'Loading local AI…');}},{context_window_size:CONTEXT_WINDOW}).then(e=>{if(cancelled)return;engine.current=e;setReady(true);setStatus('Local AI ready · 1024 context');}).catch(e=>{if(!cancelled)setStatus(`Local model error: ${e instanceof Error?e.message:'initialization failed'}`);}); return()=>{cancelled=true;};},[open,gpu]);
  const restart=async()=>{if(!engine.current||loading)return;setReady(false);setStatus('Restarting local AI…');try{await engine.current.reload(MODEL_ID,{context_window_size:CONTEXT_WINDOW});setMessages([{id:1,role:'assistant',content:welcome}]);nextId.current=2;setReady(true);setStatus('Local AI ready · 1024 context');}catch(e){setStatus(`Restart failed: ${e instanceof Error?e.message:'unknown error'}`);} };
  const ask=async(q:string)=>{const text=q.trim();if(!text||loading||!ready||!engine.current)return;const user:Message={id:nextId.current++,role:'user',content:text};const assistantId=nextId.current++;const history=[...messages,user].filter(m=>m.id!==1||messages.length>1).slice(-6).map(m=>({role:m.role,content:m.content}));setMessages(m=>[...m,user,{id:assistantId,role:'assistant',content:''}]);setInput('');setLoading(true);try{const stream=await engine.current.chat.completions.create({messages:[{role:'system',content:SYSTEM_PROMPT},...history],temperature:0.35,top_p:0.9,max_tokens:384,stream:true});let answer='';for await(const chunk of stream){const d=chunk.choices[0]?.delta?.content||'';if(!d)continue;answer+=d;setMessages(m=>m.map(x=>x.id===assistantId?{...x,content:answer}:x));}}catch(e){setMessages(m=>m.map(x=>x.id===assistantId?{...x,content:`## Assistant error\n\n${e instanceof Error?e.message:'The local model failed.'}`}:x));}finally{setLoading(false);} };
  const copy=async(text:string,id:number)=>{try{await navigator.clipboard.writeText(text);setCopied(id);window.setTimeout(()=>setCopied(null),1200);}catch{}};
  return <>
    {!open&&<button type="button" onClick={()=>setOpen(true)} className="fixed bottom-5 right-5 z-[180] rounded-full border border-white/10 bg-[#0b1220]/90 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl">Ask my portfolio</button>}
    {open&&<div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#02040a]/55 px-3 py-4 backdrop-blur-md sm:px-6">
      <section className="flex h-[min(620px,calc(100vh-30px))] w-[min(455px,calc(100vw-24px))] flex-col overflow-hidden rounded-[25px] border border-white/15 bg-[#07101b]/95 shadow-[0_32px_100px_-35px_rgba(0,0,0,.95)]">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300">▣</div>
          <div className="mr-auto min-w-0"><div className="text-sm font-semibold text-white">Ask my portfolio</div><div className="text-[11px] text-slate-500">Vidit Shah · Projects & engineering</div></div>
          <button type="button" onClick={()=>void restart()} disabled={!ready||loading} aria-label="Restart local model" className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-white/5 disabled:opacity-35">↻</button>
          <button type="button" onClick={()=>setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-white/5">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-4">
          <div className="space-y-2.5">
            {messages.map(m=><div key={m.id} className={m.role==='user'?'flex justify-end':'flex justify-start'}><div className={m.role==='user'?'max-w-[84%] rounded-2xl rounded-br-md bg-blue-500 px-3.5 py-2.5 text-[12px] leading-5 text-white shadow':'max-w-[92%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[.045] px-3.5 py-3 text-slate-200'}>{m.role==='assistant'?<><Markdown text={m.content||'Thinking…'}/>{m.content&&<div className="mt-2.5 flex items-center justify-between border-t border-white/8 pt-2"><span className="text-[9px] text-slate-600">Local · source-verified</span><button type="button" onClick={()=>void copy(m.content,m.id)} className="text-[9px] text-slate-500 hover:text-white">{copied===m.id?'Copied':'Copy'}</button></div></>:m.content}</div></div>)}
            <div ref={endRef}/>
          </div>
        </div>
        <div className="border-t border-white/10 px-3.5 pb-3.5 pt-2.5 sm:px-4">
          <div className="mb-2 flex items-center gap-2 text-[9px] text-slate-600"><span className={`size-1.5 rounded-full ${ready?'bg-emerald-400':'bg-amber-400'}`}/><span>{gpu===false?'WebGPU unavailable':status}</span></div>
          <form onSubmit={e=>{e.preventDefault();void ask(input)}} className="flex items-center gap-2">
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void ask(input);}}} rows={1} placeholder="Ask about a project or about me…" className="min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0b1220]/90 px-3.5 py-2.5 text-[12px] text-white outline-none placeholder:text-slate-600 focus:border-blue-400/35"/>
            <button type="submit" disabled={!ready||loading||!input.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/70 text-lg text-white shadow-lg disabled:opacity-30">➤</button>
          </form>
          <div className="mt-2 text-center text-[9px] text-slate-600">On-device event stream · source-verified portfolio answers · unrelated questions declined.</div>
        </div>
      </section>
    </div>}
  </>;
}
