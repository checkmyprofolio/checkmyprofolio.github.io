import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = '@cf/meta/llama-3.2-1b-instruct';
export const CONTEXT_WINDOW = 2048;
export const PORTFOLIO_AI_ENDPOINT = process.env.NEXT_PUBLIC_PORTFOLIO_AI_ENDPOINT || 'https://checkmyprofolio-github-io.workers.dev';

export type PortfolioStreamEvent = { event: 'scope'|'retrieval'|'model-loading'|'model-ready'|'token'|'grounding'|'complete'|'error'; data: string };
export type RemotePortfolioAnswer = { answer:string; mode:'model-generated'|'scope'|'error'; notice?:string; sources:string[]; model?:string };

const outOfScopeReply=`# Hey 👋

## Around here
- 🤖 I talk about **my portfolio, projects, engineering work, skills, education, and public contact details**.
- 🚫 I keep this chat focused on **me and my work**.

Ask me about a project, the way I built something, my stack, or my engineering background.`;

const scopePattern=/\\b(hi|hello|hey|yo|sup|what'?s\\s*up|whatsup|you|your|me|my|who|what|vidit|shah|portfolio|project(s)?|meeraai|meera\\s*ai|meera|aarnaai|aarna\\s*ai|robotics|automation|engineering|skill(s)?|technology|python|education|degree|college|gtu|cgpa|experience|career|github|linkedin|contact|email|resume|course(s)?|interest(s)?|goal(s)?|future|work|built|build|model(s)?|ai|machine learning|computer vision|cctv|esp32|iot|llm|rag|lora|qlora|gguf|llama|fastapi|react|next\\.js|electron|typescript|javascript|pytorch|tensorflow|opencv|plc|microcontroller|vision|software|programming|stack|architecture)\\b/i;

function evidence(question:string):string{
 const q=question.toLowerCase(), identity=portfolioFacts.identity;
 const result:Record<string,unknown>={identity:{name:identity.name,title:identity.title,statement:identity.statement,degree:identity.degree,university:identity.university,institution:identity.institution,graduation:identity.graduation,cgpa:identity.cgpa}};
 if(/contact|email|linkedin|github|reach/.test(q)) result.contact=portfolioFacts.contact;
 if(/education|degree|college|study|graduat|cgpa|course|curriculum/.test(q)) result.education=portfolioFacts.foundation;
 if(/skill|tech|stack|python|typescript|javascript|react|pytorch|tensorflow|opencv|llm|rag|lora|qlora|gguf|fastapi|electron|software|programming/.test(q)) result.skills=portfolioFacts.skillGroups;
 if(/robot|vision|control|plc|microcontroller|automation|iot|cctv/.test(q)) result.domains=portfolioFacts.domains;
 if(/meera|model|inference|local ai|browser|llama|gguf|rag|qwen/.test(q)) result.meeraAI=portfolioFacts.meeraAI;
 const matched=portfolioFacts.projects.filter(p=>{const t=`${p.title} ${p.description} ${p.narrative} ${p.tags.join(' ')}`.toLowerCase();return t.split(/\\W+/).some(term=>term.length>3&&q.includes(term));}).slice(0,3);
 result.projects=(matched.length?matched:portfolioFacts.projects.slice(0,8)).map(({title,description,narrative,tags,buildNotes,githubUrl,page})=>({title,description,narrative,tags,buildNotes,githubUrl:githubUrl==='#'?undefined:githubUrl,page}));
 return JSON.stringify(result).slice(0,9000);
}

function sourceList(question:string):string[]{const q=question.toLowerCase();const s=new Set<string>(['Verified portfolio record']);for(const p of portfolioFacts.projects){const t=`${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();if(t.split(/\\W+/).some(term=>term.length>3&&q.includes(term))){if(p.page)s.add(p.page);if(p.githubUrl&&p.githubUrl!=='#')s.add(p.githubUrl);}}return [...s].slice(0,7);}
function normalize(answer:string){const t=answer.trim();return /^#\\s/m.test(t)?t:`# Here’s the answer 👋\\n\\n${t}`;}

export async function streamPortfolioQuestion(question:string,emit:(event:PortfolioStreamEvent)=>void,history:Array<{role:'user'|'assistant';content:string}> = []):Promise<RemotePortfolioAnswer>{
 emit({event:'scope',data:'The remote model will decide whether this question is answerable.'});
 emit({event:'retrieval',data:'Sending relevant verified portfolio context.'});
 emit({event:'model-loading',data:'Sending the question to the remote GPU inference server…'});
 try{
  const response=await fetch(PORTFOLIO_AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,evidence:evidence(question),history:history.slice(-8),source:'checkmyprofolio.github.io'})});
  if(!response.ok){const detail=await response.text().catch(()=> '');throw new Error(`Remote AI server returned HTTP ${response.status}${detail?`: ${detail.slice(0,180)}`:''}`);}
  const data=await response.json() as {answer?:string;model?:string;decision?:'answer'|'refuse';style?:string;evidenceConstrained?:boolean};
  if(!data.answer?.trim())throw new Error('Remote GPU model returned an empty response.');
  emit({event:'model-ready',data:`${data.model||MODEL_ID} · server-side inference · ${data.decision||'decision'}`});
  emit({event:'token',data:data.answer});
  emit({event:'grounding',data:data.evidenceConstrained?'Answer constrained to verified portfolio evidence.':'Model response received.'});
  emit({event:'complete',data:'Remote model response ready.'});
  return{answer:normalize(data.answer),mode:data.decision==='refuse'?'scope':'model-generated',sources:[...sourceList(question),`${data.model||MODEL_ID} · remote GPU`],model:data.model||MODEL_ID};
 }catch(error){
  const detail=error instanceof Error?error.message:String(error);emit({event:'error',data:detail});emit({event:'complete',data:'Remote generation failed.'});
  return{answer:`# Remote AI is not connected yet 🔧

## What happened
- The portfolio is configured for **server-side inference**.
- The model is **not downloaded or executed on this device**.
- The remote inference endpoint could not be reached.

---

## Server
- **Model:** ${MODEL_ID}
- **Inference:** remote GPU
- **Device WebGPU:** not required`,mode:'error',notice:detail,sources:sourceList(question),model:MODEL_ID};
 }
}
