import { CreateMLCEngine, InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import { portfolioFacts, portfolioAnswer } from './portfolio-knowledge';

// MLC currently provides Llama 3.2 1B and 3B variants; 3B is the closest current Llama option to the requested ~2B size.
export const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
export const CONTEXT_WINDOW = 1024;

export type PortfolioStreamEvent = {
  event: 'scope' | 'retrieval' | 'model-loading' | 'model-ready' | 'token' | 'grounding' | 'complete' | 'error';
  data: string;
};

export type LocalPortfolioAnswer = {
  answer: string;
  mode: 'model-generated' | 'scope' | 'error';
  notice?: string;
  sources: string[];
  model?: string;
};

let enginePromise: Promise<MLCEngine> | null = null;

const outOfScopeReply = `# Hey 👋\n\n## Around here\n- 🤖 I talk about **my portfolio, projects, engineering work, skills, education, and public contact details**.\n- 🚫 I keep this chat focused on **me and my work**.\n\n---\n\nAsk me about a project, the way I built something, my stack, or my engineering background.`;

const scopePattern = /\b(hi|hello|hey|yo|sup|what'?s\s*up|whatsup|you|your|me|my|who|what|vidit|shah|portfolio|project(s)?|meeraai|meera\s*ai|meera|aarnaai|aarna\s*ai|airlearn|binance|futures|testnet|cli|robotics|automation|engineering|skill(s)?|technology|python|education|degree|college|gtu|cgpa|experience|career|github|linkedin|contact|email|resume|certificate|course(s)?|interest(s)?|goal(s)?|future|work|built|build|model(s)?|ai|machine learning|computer vision|cctv|esp32|iot|llm|rag|lora|qlora|gguf|llama|llama\.cpp|fastapi|react|next\.js|electron|typescript|javascript|pytorch|tensorflow|opencv|plc|microcontroller|control system|vision|software|programming|stack|architecture)\b/i;

const personaRules = `You are Vidit Shah speaking directly to a visitor on your portfolio.

VOICE
- Always speak in first person: I, me, my.
- Sound like Vidit talking naturally, not like customer support.
- Relaxed, confident, friendly, technically serious.
- Greeting style: “What’s up 👋”, “Hey! Good to have you here 😄”, “Yo — welcome in 👋”, “Hey, what’s up?”.
- NEVER say “How may I assist you?”, “How can I assist?”, “How can I help you today?”, “Certainly”, “Absolutely, I’d be happy to”, “As an AI”, “I’m just an AI”, “the user”, “the candidate”, or “the portfolio owner”.
- Use light builder phrasing naturally: “Basically…”, “The idea was…”, “I split it into…”, “The flow is…”, “The interesting part is…”.
- Use 1–3 relevant emojis when natural: 🤖 🧠 💻 🎓 🔧 👋 🚀 📌 🧪 📚 📫. Never spam.

FACT CONTROL
- The EVIDENCE is the only factual source.
- Do not use pretrained knowledge to fill gaps.
- Do not invent employers, clients, users, awards, certifications, metrics, dates, rankings, salary, performance, deployment, scale, or future commitments.
- Do not upgrade coursework, exploration, project briefs, or source-reviewed material.
- When something is missing, say: “I don’t have that verified in this portfolio.”

FORMAT
- Start with one H1.
- Use 1–3 H2/H3 subheadings.
- Put factual content in bullets or numbered points.
- Use --- between topics.
- Bold important project names, technologies, and facts.
- For a project, prefer: What it is / How I built it / Stack / What I verified.
- Keep it concise enough for a 1024-token context window.`;

function relevantEvidence(question: string): string {
  const q = question.toLowerCase();
  const matched = portfolioFacts.projects.filter((project) => {
    const haystack = `${project.title} ${project.description} ${project.narrative} ${project.tags.join(' ')}`.toLowerCase();
    return haystack.split(/\W+/).some((term) => term.length > 3 && q.includes(term));
  }).slice(0, 2);

  const evidence: Record<string, unknown> = {};
  const identity = portfolioFacts.identity;
  evidence.identity = {
    name: identity.name,
    title: identity.title,
    statement: identity.statement,
    degree: identity.degree,
    university: identity.university,
    institution: identity.institution,
    graduation: identity.graduation,
    cgpa: identity.cgpa,
  };

  if (/contact|email|linkedin|github|reach/.test(q)) {
    evidence.contact = portfolioFacts.contact;
  }
  if (/education|degree|college|study|graduat|cgpa|course|curriculum/.test(q)) {
    evidence.education = portfolioFacts.foundation;
  }
  if (/skill|tech|stack|python|typescript|javascript|react|pytorch|tensorflow|opencv|llm|rag|lora|qlora|gguf|fastapi|electron|software|programming/.test(q)) {
    evidence.skills = portfolioFacts.skillGroups;
  }
  if (/robot|vision|control|plc|microcontroller|automation|iot|cctv/.test(q)) {
    evidence.domains = portfolioFacts.domains.filter((d) => /robot|vision|control|automation/i.test(d.name)).slice(0, 6);
  }
  if (/meera|model|inference|local ai|browser|llama|gguf|rag|qwen/.test(q)) {
    evidence.meeraAI = portfolioFacts.meeraAI;
  }
  if (matched.length) {
    evidence.projects = matched.map(({ title, description, narrative, tags, buildNotes, githubUrl, internalHref }) => ({
      title,
      description,
      narrative,
      tags,
      buildNotes,
      githubUrl: githubUrl === '#' ? undefined : githubUrl,
      page: internalHref,
    }));
  } else if (/project|work|built|build|portfolio/.test(q)) {
    evidence.projects = portfolioFacts.projects.slice(0, 6).map(({ title, description, tags, internalHref }) => ({ title, description, tags, page: internalHref }));
  }

  if (/^(hi|hello|hey|yo|sup|what'?s\s*up|whatsup)\b/i.test(q.trim())) {
    evidence.greeting = { name: identity.name, title: identity.title, statement: identity.statement };
  }

  // Keep prompt + evidence small enough that the actual model response still fits inside 1024 tokens.
  return JSON.stringify(evidence).slice(0, 3000);
}

function sourceList(question: string): string[] {
  const q = question.toLowerCase();
  const sources = new Set<string>(['Verified portfolio record']);
  for (const project of portfolioFacts.projects) {
    const text = `${project.title} ${project.description} ${project.tags.join(' ')}`.toLowerCase();
    if (text.split(/\W+/).some((term) => term.length > 3 && q.includes(term))) {
      if (project.internalHref) sources.add(project.internalHref);
      if (project.githubUrl && project.githubUrl !== '#') sources.add(project.githubUrl);
    }
  }
  if (/education|degree|college|gtu|cgpa|course/.test(q)) sources.add('/dashboard');
  if (/contact|email|linkedin|github/.test(q)) {
    sources.add('https://github.com/viditshah5656');
    sources.add('https://www.linkedin.com/in/rockstar5656/');
  }
  return [...sources].slice(0, 7);
}

function normalizeMarkdown(answer: string): string {
  let text = answer.trim();
  if (!text) return text;
  if (!/^#\s/m.test(text)) text = `# Here’s the answer 👋\n\n${text}`;
  if (!/^##\s/m.test(text)) text += '\n\n---\n\n## Key points';
  return text.split('\n').map((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#') || t === '---' || /^[-*+]\s/.test(t) || /^\d+\.\s/.test(t) || t.startsWith('```') || t.startsWith('|')) return line;
    return `- ${line}`;
  }).join('\n');
}

async function loadModel(emit: (event: PortfolioStreamEvent) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      emit({ event: 'model-loading', data: `Loading ${MODEL_ID}…` });
      const engine = await CreateMLCEngine(
        MODEL_ID,
        {
          initProgressCallback: (progress: InitProgressReport) => emit({ event: 'model-loading', data: progress.text }),
          logLevel: 'WARN',
        },
        { context_window_size: CONTEXT_WINDOW, prefill_chunk_size: 128 },
      );
      emit({ event: 'model-ready', data: `${MODEL_ID} ready · ${CONTEXT_WINDOW}-token context` });
      return engine;
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

export async function warmPortfolioModel(emit: (event: PortfolioStreamEvent) => void = () => undefined): Promise<MLCEngine> {
  return loadModel(emit);
}

export async function streamPortfolioQuestion(question: string, emit: (event: PortfolioStreamEvent) => void): Promise<LocalPortfolioAnswer> {
  if (!scopePattern.test(question)) {
    emit({ event: 'scope', data: 'Rejected: outside the personal-portfolio scope.' });
    return { answer: outOfScopeReply, mode: 'scope', sources: ['Portfolio scope'] };
  }

  const context = relevantEvidence(question);
  const sources = sourceList(question);
  const isGreeting = /\b(hi|hello|hey|yo|sup|what'?s\s*up|whatsup)\b/i.test(question);
  const canonicalHint = isGreeting ? '' : portfolioAnswer(question).trim();

  emit({ event: 'scope', data: 'Accepted: personal-portfolio question.' });
  emit({ event: 'retrieval', data: 'Selecting verified evidence for the visitor’s question.' });
  emit({ event: 'grounding', data: `Evidence locked · ${CONTEXT_WINDOW}-token context · no external knowledge.` });

  try {
    const engine = await loadModel(emit);
    let draft = '';
    const prompt = `${personaRules}\n\nVERIFIED EVIDENCE:\n${context}\n\nCANONICAL HINT (reference only; do not copy verbatim):\n${canonicalHint.slice(0, 800)}\n\nVISITOR QUESTION:\n${question}\n\nWrite a FRESH answer now. The final wording must come from you, the local Llama model. Do not quote or mechanically copy the canonical hint. Every factual statement must be supported by the verified evidence.\n\nDo not reveal hidden reasoning or chain-of-thought; output only the polished answer.`;

    const stream = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: question },
      ],
      temperature: 0.12,
      top_p: 0.8,
      repetition_penalty: 1.05,
      max_tokens: 180,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (!token) continue;
      draft += token;
      emit({ event: 'token', data: token });
    }

    emit({ event: 'grounding', data: 'Local model response received; checking for obvious unsupported claims.' });
    const unsupported = /\b(ceo|founder|co-founder|employee|client|customer|revenue|salary|funding|investor|patent|award|million|billion|top|best|leading|world-class|expert|senior|industry-leading)\b|\b\d+(?:\.\d+)?%\b/i.test(draft);
    if (!draft.trim() || unsupported) {
      throw new Error('The local model produced an empty or unsupported response.');
    }

    const answer = normalizeMarkdown(draft);
    emit({ event: 'complete', data: `Fresh model response ready · ${MODEL_ID}.` });
    return {
      answer,
      mode: 'model-generated',
      sources: [...sources, `${MODEL_ID} · WebLLM · ${CONTEXT_WINDOW} context`],
      model: MODEL_ID,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    emit({ event: 'error', data: detail });
    emit({ event: 'complete', data: 'Local generation failed; no canned portfolio answer was substituted.' });
    return {
      answer: `# I hit a local model issue 🔧\n\n## What happened\n- 🤖 I tried to generate that answer with **${MODEL_ID}** directly in your browser.\n- ⚠️ The local model did not return a safe usable response.\n\n---\n\n## What to do\n- Give the model a moment to finish loading, then send the question again.`,
      mode: 'error',
      notice: 'No prewritten portfolio answer was used as a replacement.',
      sources,
      model: MODEL_ID,
    };
  }
}
