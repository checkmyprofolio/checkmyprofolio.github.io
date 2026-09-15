import { CreateMLCEngine, InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import { portfolioAnswer, portfolioFacts } from './portfolio-knowledge';

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const CONTEXT_WINDOW = 1024;

export type PortfolioStreamEvent = {
  event: 'scope' | 'retrieval' | 'model-loading' | 'token' | 'grounding' | 'complete';
  data: string;
};

export type LocalPortfolioAnswer = {
  answer: string;
  mode: 'verified-response' | 'portfolio';
  notice?: string;
  sources: string[];
};

let enginePromise: Promise<MLCEngine> | null = null;

const scopePattern = /\b(hi|hello|hey|yo|sup|what's up|whatsup|you|your|me|my|who|what|vidit|shah|portfolio|project(s)?|meeraai|meera\s*ai|meera|aarnaai|aarna\s*ai|airlearn|binance|futures|testnet|cli|robotics|automation|engineering|skill(s)?|technology|python|education|degree|college|gtu|cgpa|experience|career|github|linkedin|contact|email|resume|certificate|course(s)?|interest(s)?|goal(s)?|future|work|built|build|model(s)?|ai|machine learning|computer vision|cctv|esp32|iot|openai|llm|rag|lora|qlora|gguf|llama\.cpp|fastapi|react|next\.js|electron|typescript|javascript|pytorch|tensorflow|opencv|plc|microcontroller|control system|vision|software|programming|stack|architecture)\b/i;

const outOfScopeReply = `# Hey 👋\n\n## What I talk about\n- 🤖 **My robotics, AI, and engineering work**\n- 🧠 **My projects**, including MeeraAI and my software experiments\n- 💻 **My technical skills and systems work**\n- 🎓 **My education and engineering background**\n- 📫 **My public contact details**\n\n---\n\nI keep this chat focused on **me and my portfolio** rather than random topics.`;

const personaRules = `You are Vidit Shah speaking directly to a visitor on his public portfolio.

PERSONA — THIS SHOULD SOUND LIKE VIDIT, NOT A CHATBOT:
- Speak in the first person: “I”, “my”, “me”.
- Imagine you are standing beside the portfolio and talking to a recruiter, engineer, student, or curious visitor.
- Relaxed, confident, friendly, technically serious, and natural.
- Greetings should sound conversational. Good examples: “What’s up 👋”, “Hey! Good to have you here 😄”, “Yo — welcome in 👋”, “Hey, what’s up?”
- For a simple greeting, respond like a person first, then lightly invite a portfolio question. Example pattern: “What’s up 👋\n\n## Around here\n- 🤖 I work on robotics and AI…\n- 💻 I build software systems…\n\n---\n\nAsk me about any project and I’ll walk you through it.”
- NEVER say “How may I assist you?”, “How can I assist?”, “How can I help you today?”, “Certainly”, “Absolutely, I’d be happy to”, “As an AI”, “I’m just an AI”, “the user”, or “the candidate”.
- Never describe Vidit in third person unless the visitor explicitly asks for third-person wording.
- Do not sound like customer support, a corporate FAQ, or an academic abstract.
- Use light conversational connectors such as “Basically”, “The idea is”, “What I was trying to do was…”, “The interesting part is…”, “For me, the main thing was…”, but only when natural.
- Emojis are allowed and encouraged in moderation: normally 1–4 per answer, chosen to fit the topic (🤖 🧠 💻 🎓 🔧 👋 🚀 📌 🧪 📚 📫).
- Never spam emojis and never use emoji-only answers for technical questions.

VOICE CONSISTENCY:
- Prefer short, direct sentences mixed with compact technical detail.
- When explaining architecture, talk like the builder: “I split it into…”, “I kept…”, “The flow is…”, “I used…”.
- When describing limitations, be honest: “I haven’t established that publicly”, “That part is still exploration”, “I don’t have a verified number for that here.”
- Never manufacture confidence where the evidence is uncertain.

MANDATORY RESPONSE SHAPE:
- ALWAYS start with a clear H1 heading.
- ALWAYS include at least one H2 or H3 subheading.
- Main information MUST be in bullet points or numbered points.
- Use “---” as a visual topic separator whenever the answer contains more than one topic.
- Prefer 2–4 compact sections instead of one wall of text.
- Use bold for key technical names and important facts.
- Render lists naturally; do not dump comma-separated mega-lists when grouping is possible.
- For a project explanation, prefer sections such as “## What it is”, “### How I built it”, “### Stack”, “### What I verified”.
- For education, group by areas such as “## Education”, “### Robotics & control”, “### AI & computation”.
- For skills, group by domain.
- Use Markdown tables only when comparison is genuinely clearer.

GROUNDING CONTRACT:
- The supplied VERIFIED ANSWER is the canonical factual answer.
- The supplied EVIDENCE is the only source of additional facts.
- Your task is to preserve the canonical answer’s meaning while rewriting it naturally in Vidit’s voice.
- You may reorganize, shorten, expand with directly supported evidence, and add conversational phrasing.
- You MUST NOT invent facts from pretrained knowledge.
- Do not invent employers, clients, users, awards, certifications, dates, model performance, benchmark scores, funding, deployments, production scale, salaries, rankings, locations, or future commitments.
- Do not upgrade “exploration”, “coursework”, “project brief”, or “source reviewed” into a stronger claim.
- When the evidence is insufficient, explicitly say so.
`;

function relevantContext(question: string) {
  const query = question.toLowerCase();
  const projectFacts = portfolioFacts.projects.filter((project) => {
    const searchable = `${project.title} ${project.description} ${project.narrative} ${project.tags.join(' ')} ${project.buildNotes}`.toLowerCase();
    return searchable.split(/\W+/).some((word) => word.length > 3 && query.includes(word));
  });

  const payload: Record<string, unknown> = {
    identity: portfolioFacts.identity,
    foundation: portfolioFacts.foundation,
    engineeringMethod: portfolioFacts.engineeringMethod,
    canonicalAnswer: portfolioAnswer(question),
  };

  if (/contact|email|reach|linkedin|github/.test(query)) payload.contact = portfolioFacts.contact;
  if (projectFacts.length) payload.projects = projectFacts;
  if (/project|work|built|build|portfolio|experience|career/.test(query) && !projectFacts.length) {
    payload.projects = portfolioFacts.projects.map(({ title, description, narrative, tags, page, githubUrl }) => ({ title, description, narrative, tags, page, githubUrl }));
  }
  if (/skill|tech|stack|python|pytorch|tensorflow|opencv|react|typescript|javascript|llm|rag|lora|qlora|gguf|fastapi|electron|docker|linux|software|programming/.test(query)) payload.skills = portfolioFacts.skills;
  if (/meera|model|tier|inference|local ai|browser|llama|gguf|rag|qwen/.test(query)) payload.meeraAI = portfolioFacts.meeraAI;
  if (/robot|vision|control|plc|microcontroller|automation|iot|cctv/.test(query)) payload.domains = portfolioFacts.domains;

  return JSON.stringify(payload).slice(0, 7200);
}

function sourceList(question: string) {
  const q = question.toLowerCase();
  const matched = portfolioFacts.projects.filter((project) => {
    const searchable = `${project.title} ${project.description} ${project.narrative} ${project.tags.join(' ')}`.toLowerCase();
    return searchable.split(/\W+/).some((word) => word.length > 3 && q.includes(word));
  });

  const sources = ['Verified portfolio facts'];
  matched.slice(0, 4).forEach((project) => {
    if (project.page) sources.push(project.page);
    if (project.githubUrl) sources.push(project.githubUrl);
  });

  if (/education|degree|college|gtu|cgpa|course/.test(q)) sources.push('/dashboard');
  if (/contact|email|linkedin|github/.test(q)) {
    sources.push('https://github.com/viditshah5656');
    sources.push('https://www.linkedin.com/in/rockstar5656/');
  }

  return [...new Set(sources)].slice(0, 7);
}

function normalizeMarkdown(answer: string) {
  let text = answer.trim();
  if (!text) return text;
  if (!/^#\s/m.test(text)) text = `# Here’s the answer 👋\n\n${text}`;
  if (!/^#{2,3}\s/m.test(text)) text += `\n\n---\n\n## The key points\n`;

  const lines = text.split('\n');
  const formatted = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed === '---' || /^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || trimmed.startsWith('```') || trimmed.startsWith('|')) return line;
    if (/^(https?:\/\/|www\.)/.test(trimmed)) return `- 🔗 ${trimmed}`;
    return line;
  });
  return formatted.join('\n');
}

function looksGrounded(draft: string, canonical: string, context: string): boolean {
  const clean = draft.trim();
  if (!clean || clean.length < 30) return false;

  const canonicalWords = canonical.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  const draftLower = clean.toLowerCase();
  const supportedWords = new Set(context.toLowerCase().split(/\W+/).filter((w) => w.length > 4));
  const overlap = canonicalWords.filter((w) => draftLower.includes(w) && supportedWords.has(w)).length;
  const overlapRatio = canonicalWords.length ? overlap / Math.min(canonicalWords.length, 30) : 0;

  const unsupportedRisk = [
    /\b(ceo|founder|employee|employed|client|clients|users?|customer|revenue|salary|award|awards|patent|funding|investor|million|billion|viral|production-ready)\b/i,
    /\b\d{2,3}%\b/,
    /\b(top|best|leading|world-class|expert|senior)\b/i,
  ];
  if (unsupportedRisk.some((pattern) => pattern.test(clean) && !pattern.test(canonical))) return false;

  return overlapRatio >= 0.20 || canonical.length < 120;
}

async function loadModel(emit: (event: PortfolioStreamEvent) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress: InitProgressReport) => emit({ event: 'model-loading', data: progress.text }),
      logLevel: 'WARN',
    }, { context_window_size: CONTEXT_WINDOW });
  }
  return enginePromise;
}

export async function streamPortfolioQuestion(question: string, emit: (event: PortfolioStreamEvent) => void): Promise<LocalPortfolioAnswer> {
  if (!scopePattern.test(question)) {
    emit({ event: 'scope', data: 'Rejected: outside the personal-portfolio scope.' });
    return { answer: normalizeMarkdown(outOfScopeReply), mode: 'portfolio', sources: ['Portfolio scope'] };
  }

  const verifiedAnswer = portfolioAnswer(question).trim();
  const canonical = verifiedAnswer || "I don't have a verified answer to that in this portfolio.";
  const context = relevantContext(question);
  const sources = sourceList(question);

  emit({ event: 'scope', data: 'Accepted: personal-portfolio question.' });
  emit({ event: 'retrieval', data: 'Selecting verified facts relevant to this question.' });
  emit({ event: 'grounding', data: `Canonical answer locked · ${CONTEXT_WINDOW}-token context · no external knowledge.` });

  try {
    const engine = await loadModel(emit);
    let draft = '';

    const prompt = `${personaRules}\n\nCANONICAL VERIFIED ANSWER:\n${canonical}\n\nVERIFIED EVIDENCE:\n${context}\n\nVISITOR QUESTION:\n${question}\n\nRewrite the canonical answer as Vidit speaking naturally to the visitor. Preserve its factual meaning. Keep the answer concise but useful. Use a friendly greeting only when the visitor greets. Use tasteful emojis. Use H1 + H2/H3 + bullet points + “---” topic separators. Never add a fact.`;

    const reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: question },
      ],
      temperature: 0.02,
      top_p: 0.65,
      max_tokens: 300,
      stream: true,
    });

    for await (const chunk of reply) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (!token) continue;
      draft += token;
      emit({ event: 'token', data: token });
    }

    emit({ event: 'grounding', data: 'Validating the draft against the canonical answer and evidence.' });
    const grounded = looksGrounded(draft, canonical, context);
    const answer = grounded ? normalizeMarkdown(draft) : normalizeMarkdown(canonical);

    if (!grounded) {
      emit({ event: 'grounding', data: 'Model draft was too risky or weakly grounded; deterministic portfolio answer used.' });
      emit({ event: 'complete', data: 'Safe verified portfolio response ready.' });
      return {
        answer,
        mode: 'portfolio',
        notice: 'I kept this response strictly tied to verified portfolio evidence.',
        sources,
      };
    }

    emit({ event: 'complete', data: 'Persona-matched, evidence-constrained response ready.' });
    return { answer, mode: 'verified-response', sources: [...sources, `Local Qwen2.5-0.5B · ${CONTEXT_WINDOW} context`] };
  } catch {
    emit({ event: 'grounding', data: 'Local model unavailable; deterministic verified answer selected.' });
    emit({ event: 'complete', data: 'Verified portfolio response ready.' });
    return {
      answer: normalizeMarkdown(canonical),
      mode: 'portfolio',
      notice: 'The local model was unavailable, so I kept this strictly grounded in the portfolio record.',
      sources,
    };
  }
}
