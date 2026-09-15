'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Layers3 } from 'lucide-react';
import { meeraCapabilities, meeraModels, meeraValidation } from '@/lib/meeraai-content';

export function MeeraAICapabilities() {
 const reduced = useReducedMotion();
 return <div className="mx-auto max-w-[110rem] space-y-10 px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
  <section id="capabilities" className="scroll-mt-28">
   <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Current capabilities</p>
   <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">More than a chat window.</h2>
   <p className="mt-4 max-w-3xl leading-7 text-slate-300">I built MeeraAI around the tasks I want an assistant to help with: reading, browsing, managing models, and working on software. Open a capability to see how it works and what has been tested.</p>
   <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
    {meeraCapabilities.map((capability,index)=><motion.details key={capability.title}
     initial={reduced ? false : {opacity:0,y:18}} whileInView={{opacity:1,y:0}}
     viewport={{once:true,amount:0.15}} transition={{duration:0.4,delay:(index%2)*0.07}}
     className="group rounded-2xl border border-white/10 bg-white/[0.035] shadow-lg backdrop-blur-xl transition-colors hover:border-sky-300/30 open:border-sky-300/25 open:bg-sky-400/[0.05]">
     <summary className="flex cursor-pointer list-none items-center gap-4 rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-sky-300 [&::-webkit-details-marker]:hidden">
      <Layers3 className="h-5 w-5 shrink-0 text-sky-300"/><span className="flex-1"><span className="block font-semibold text-white">{capability.title}</span><span className="mt-2 block text-xs text-slate-400">{capability.status}</span></span><ChevronDown className="h-4 w-4 text-sky-200 transition-transform group-open:rotate-180"/>
     </summary>
     <p className="px-5 pb-5 text-sm leading-7 text-slate-300">{capability.text}</p>
    </motion.details>)}
   </div>
   <div className="mt-6 rounded-2xl border border-lime-300/15 bg-lime-300/[0.035] p-5 text-sm leading-7 text-slate-300">
    <h3 className="font-semibold text-white">Model profiles and installed files</h3>
    <p className="mt-2">The backend prefers IQ4_XS for the first five tiers and IQ3_M for Deep and Ultra. Model Studio labels Meera as Pro and Vision as Max; its Max entry lists IQ3_M / IQ2_M instead. Recorded Qwen runs use IQ4_NL. These differences are kept visible here because a profile label alone does not identify the loaded file.</p>
    <p className="mt-2">Configured backend context: {meeraModels[2].name} uses 12,288 tokens; the other profiles use 16,384. These are runtime defaults, not guaranteed usable context or memory requirements on every machine. Vision needs a compatible model file, projector, and runtime; its presence in the catalog is not proof that a visual task passed.</p>
   </div>
  </section>
  <section id="validation" className="scroll-mt-28">
   <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-200">Checked on 15 September 2026</p>
   <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">What has actually been checked.</h2>
   <p className="mt-4 max-w-3xl leading-7 text-slate-300">I want this page to describe the app accurately. Passing software tests, recorded model generation, and successful real-world assistant tasks are different kinds of evidence.</p>
   <div className="mt-6 grid gap-4 md:grid-cols-2">
    {meeraValidation.map((item,index)=><motion.article key={item.title}
     initial={reduced ? false : {opacity:0,y:18}} whileInView={{opacity:1,y:0}}
     viewport={{once:true,amount:0.15}} transition={{duration:0.4,delay:(index%2)*0.07}}
     className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-xl transition-colors hover:border-lime-300/25">
     <CheckCircle2 className="mb-4 h-5 w-5 text-lime-200"/><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
    </motion.article>)}
   </div>
   <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-400">Online pages and external providers still require network access. Optional RAG services can process data remotely. No across-the-board privacy, VRAM fit, token-speed, booking success, or packaged-release guarantee is claimed. Older screenshot assets and download archives are not evidence of the current app build.</p>
  </section>
 </div>;
}
