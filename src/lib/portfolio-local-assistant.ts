import { CreateMLCEngine, InitProgressReport, MLCEngine } from '@mlc-ai/web-llm';
import { portfolioAnswer, portfolioFacts } from './portfolio-knowledge';

const PRIMARY_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const FALLBACK_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const CONTEXT_WINDOW = 1024;

export type PortfolioStreamEvent = {
  event: 'scope' | 'retrieval' | 'model-loading' | 'model-ready' | 'token' | 'grounding' | 'complete' | 'error';
  data: string;
};

export type LocalPortfolioAnswer = {
  answer: string;
  mode: 'verified-response' | 'portfolio';
  notice?: string;
  sources: string[];
  model?: string;
};

let enginePromise: Promise<MLCEngine> | null = null;
let activeModelId: string | null = null;

const scopePattern = /\b(hi|hello|hey|yo|sup|what'?s\s*up|whatsup|you|your|me|my|who|what|vidit|shah|portfolio|project(s)?|meeraai|meera\s*ai|meera|aarnaai|aarna\s*ai|airlearn|binance|futures|testnet|cli|robotics|automation|engineering|skill(s)?|technology|python|education|degree|college|gtu|cgpa|experience|career|github|linkedin|contact|email|resume|certificate|course(s)?|interest(s)?|goal(s)?|future|work|built|build|model(s)?|ai|machine learning|computer vision|cctv|esp32|iot|openai|llm|rag|lora|qlora|gguf|llama\.cpp|fastapi|react|next\.js|electron|typescript|javascript|pytorch|tensorflow|opencv|plc|microcontroller|control system|vision|software|programming|stack|architecture)\b/i;

const outOfScopeReply = `# That’s outside my portfolio 👋\n\n## What I talk about\n- 🤖 My robotics, AI, and engineering work\n- 🧠 My projects and how I built them\n- 💻 My technical skills and software systems\n- 🎓 My education and engineering background\n- 📫 My public contact details\n\n---\n\nAsk me about **Vidit, my projects, my engineering work, or my background**.`;

const personaRules = `You are Vidit Shah speaking directly to a visitor on my public portfolio.

VOICE:
- Speak naturally in first person: I / my / me.
- Sound like Vidit, not a support bot.
- Relaxed, confident, friendly, technically serious.
- Never say “How may I assist you?”, “How can I assist?”, “How can I help you today?”, “Certainly”, “Absolutely, I’d be happy to”, “As an AI”, “I’m just an AI”, “the user”, “the candidate”, or “the portfolio owner”.
- For greetings, use natural phrases like “What’s up 👋”, “Hey! Good to have you here 😄”, “Yo — welcome in 👋”, or “Hey, what’s up?”. Do not use a canned support greeting.
- Use conversational builder language when appropriate: “Basically…”, “The idea was…”, “I split it into…”, “The flow is…”, “The interesting part is…”, “For me, the main thing was…”.
- Use 1–4 tasteful emojis when they fit the answer. Do not spam emojis.

FACTS:
- You may ONLY use information present in VERIFIED EVIDENCE or the CANONICAL ANSWER.
- Never use pretrained/general knowledge to fill gaps.
- Never invent employers, clients, users, customers, awards, certifications, dates, salaries, rankings, performance numbers, benchmark scores, deployment claims, production scale, or future commitments.
- Do not upgrade coursework, exploration, project brief, or source-reviewed evidence into stronger claims.
- When the evidence does not establish something, say: “I don’t have a verified answer to that in this portfolio.”

FORMAT:
- ALWAYS start with an H1 heading.
- ALWAYS include at least one H2/H3 subheading.
- Put substantive information in bullet points or numbered points.
- Use “---” between distinct topics.
- Use concise sections rather than a wall of text.
- Bold important technical names and facts.
- For projects, prefer: “## What it is”, “### How I built it”, “### Stack”, “### What I verified”.
- For education, group by subject areas.
- For skills, group by domain.
- Use tables only when a comparison is genuinely clearer.

IMPORTANT:
- Your job is to WRITE the final answer. Do not merely copy the canonical answer verbatim.
- Rephrase it naturally in Vidit’s voice while preserving every factual constraint.
- A greeting can be fully generated from the identity evidence even if the canonical answer has no specific fact.
`;

function relevantContext(question: string) {
  const query = question.toLowerCase();
  const projectFacts = portfolioFacts.projects.filter((project) => {
    const title = project.title.toLowerCase();
    const tags = project.tags.join(' ').toLowerCase();
    const aliases = [
      title,
      ...project.title.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 3),
      ...tags.split(/[^a-z0-9]+/).filter((x) => x.length > 3),
    ];
    return aliases.some((term) => term && (query.includes(term) || query.includes(term.replace(/\s+/g, ''))));
  });

  const payload: Record<string, unknown> = {
    identity: portfolioFacts.identity,
    foundation: portfolioFacts.foundation,
    engineeringMethod: portfolioFacts.engineeringMethod,
  };

  if (/contact|email|reach|linkedin|github/.test(query)) payload.contact = portfolioFacts.contact;
  if (projectFacts.length) payload.projects = projectFacts;
  if (/project|work|built|build|portfolio|experience|career/.test(query) && !projectFacts.length) {
    payload.projects = portfolioFacts.projects.map(({ title, description, narrative, tags, page, githubUrl }) => ({ title, description, narrative, tags, page, githubUrl }));
  }
  if (/skill|tech|stack|python|pytorch|tensorflow|opencv|react|typescript|javascript|llm|rag|lora|qlora|gguf|fastapi|electron|docker|linux|software|programming/.test(query)) payload.skills = portfolioFacts.skills;
  if (/meera|model|tier|inference|local ai|browser|llama|gguf|rag|qwen/.test(query)) payload.meeraAI = portfolioFacts.meeraAI;
  if (/robot|vision|control|plc|microcontroller|automation|iot|cctv/.test(query)) payload.domains = portfolioFacts.domains;

  return JSON.stringify(payload).slice(0, 7600);
}

function sourceList(question: string) {
  const q = question.toLowerCase();
  const sources = new Set<string>(['Verified portfolio record']);
  const aliases: Record<string, string[]> = {
    meeraai: ['meeraai', 'meera ai', 'meera'],
    aarnaai: ['aarnaai', 'aarna ai'],
    airlearn: ['airlearn', 'air learn'],
    'binance-futures': ['binance', 'futures testnet', 'testnet cli'],
    profolio: ['profolio', 'portfolio'],
    vision: ['vision', 'cctv'],
  };

  for (const project of portfolioFacts.projects) {
    const key = Object.keys(aliases).find((alias) => aliases[alias].some((term) => q.includes(term)));
    if (!key) continue;
    if (project.page) sources.add(project.page);
    if (project.githubUrl) sources.add(project.githubUrl);
  }

  if (/education|degree|college|gtu|cgpa|course|subject/.test(q)) sources.add('/dashboard');
  if (/contact|email|linkedin/.test(q)) {
    sources.add('https://github.com/viditshah5656');
    sources.add('https://www.linkedin.com/in/rockstar5656/');
  }

  return [...sources].slice(0, 7);
}

function normalizeMarkdown(answer: string) {
  let text = answer.trim();
  if (!text) return text;
  if (!/^#\s/m.test(text)) text = `# Here’s the answer 👋\n\n${text}`;
  if (!/^#{2,3}\s/m.test(text)) text += `\n\n---\n\n## Key points\n- 📌 I’ve kept this answer tied to the verified portfolio evidence.`;

  return text
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#') || t === '---' || /^[-*+]\s/.test(t) || /^\d+\.\s/.test(t) || t.startsWith('```') || t.startsWith('|')) return line;
      if (/^(https?:\/\/|www\.)/.test(t)) return `- 🔗 ${t}`;
      return line;
    })
    .join('\n');
}

function validateGeneratedAnswer(draft: string, context: string, question: string) {
  const clean = draft.trim();
  if (!clean || clean.length < 24) return false;

  const lower = clean.toLowerCase();
  const evidence = context.toLowerCase();
  const questionLower = question.toLowerCase();

  const dangerous = [
    /\b(ceo|founder|co-founder|employee|employed|client|clients|customer|customers|revenue|salary|funding|investor|patent|award|awards|million|billion|users?)\b/i,
    /\b\d+(?:\.\d+)?%\b/i,
    /\b(top|best|leading|world-class|expert|senior|industry-leading)\b/i,
  ];
  if (dangerous.some((pattern) => pattern.test(clean) && !pattern.test(evidence))) return false;

  // Greetings do not need a factual overlap test; they are still model-generated.
  if (/\b(hi|hello|hey|yo|sup|what'?s\s*up|whatsup)\b/i.test(questionLower)) return true;

  const evidenceTerms = new Set(evidence.split(/\W+/).filter((term) => term.length >= 5));
  const draftTerms = lower.split(/\W+/).filter((term) => term.length >= 5);
  const supported = draftTerms.filter((term) => evidenceTerms.has(term)).length;
  const ratio = draftTerms.length ? supported / Math.min(draftTerms.length, 60) : 0;

  return ratio >= 0.08;
}

async function initializeModel(emit: (event: PortfolioStreamEvent) => void): Promise<MLCEngine> {
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const candidates = [PRIMARY_MODEL_ID, FALLBACK_MODEL_ID];
    let lastError: unknown = null;

    for (const modelId of candidates) {
      try {
        emit({ event: 'model-loading', data: `Loading local model: ${modelId}` });
        const engine = await CreateMLCEngine(
          modelId,
          {
            initProgressCallback: (progress: InitProgressReport) => emit({ event: 'model-loading', data: progress.text }),
            logLevel: 'WARN',
          },
          { context_window_size: CONTEXT_WINDOW },
        );
        activeModelId = modelId;
        emit({ event: 'model-ready', data: `${modelId} ready · ${CONTEXT_WINDOW}-token context` });
        return engine;
      } catch (error) {
        lastError = error;
        const detail = error instanceof Error ? error.message : String(error);
        emit({ event: 'error', data: `${modelId} failed: ${detail}` });
      }
    }

    throw lastError instanceof Error ? lastError : new Error('No local WebLLM model could be initialized.');
  })().catch((error) => {
    enginePromise = null;
    throw error;
  });

  return enginePromise;
}

export async function streamPortfolioQuestion(question: string, emit: (event: PortfolioStreamEvent) => void): Promise<LocalPortfolioAnswer> {
  if (!scopePattern.test(question)) {
    emit({ event: 'scope', data: 'Rejected: outside the personal-portfolio scope.' });
    return { answer: normalizeMarkdown(outOfScopeReply), mode: 'portfolio', sources: ['Portfolio scope'] };
  }

  const context = relevantContext(question);
  const canonicalRaw = portfolioAnswer(question).trim();
  const isGreeting = /\b(hi|hello|hey|yo|sup|what'?s\s*up|whatsup)\b/i.test(question);
  const canonical = isGreeting ? 'Greeting acknowledged. No additional portfolio claim is required.' : (canonicalRaw || "I don't have a verified answer to that in this portfolio.");
  const sources = sourceList(question);

  emit({ event: 'scope', data: 'Accepted: personal-portfolio question.' });
  emit({ event: 'retrieval', data: 'Selecting the smallest relevant set of verified portfolio evidence.' });
  emit({ event: 'grounding', data: `Evidence locked · ${CONTEXT_WINDOW}-token context · no external knowledge.` });

  try {
    const engine = await initializeModel(emit);
    let draft = '';
    const prompt = `${personaRules}\n\nCANONICAL ANSWER:\n${canonical}\n\nVERIFIED EVIDENCE:\n${context}\n\nVISITOR QUESTION:\n${question}\n\nWrite the final answer now. This MUST be a freshly generated response from the local language model, not a copy of the canonical answer. Keep every factual statement within the evidence.\n\nBefore generating, silently check that every claim can be supported by the evidence. Do not reveal hidden reasoning; output only the finished answer.`;

    const reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: question },
      ],
      temperature: 0.12,
      top_p: 0.80,
      repetition_penalty: 1.05,
      max_tokens: 280,
      stream: true,
    });

    for await (const chunk of reply) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (!token) continue;
      draft += token;
      emit({ event: 'token', data: token });
    }

    emit({ event: 'grounding', data: 'Checking the generated wording against the verified evidence.' });
    if (!validateGeneratedAnswer(draft, context, question)) {
      emit({ event: 'grounding', data: 'Generated draft failed the grounding gate; no unsupported claims will be shown.' });
      emit({ event: 'complete', data: 'Grounding gate blocked the draft.' });
      return {
        answer: normalizeMarkdown("# I don’t want to guess 👋\n\n## What I can verify\n- 📌 I only want to give you information that is established by this portfolio.\n- 🔎 I couldn’t safely verify the wording the local model produced for that question.\n\n---\n\nAsk me about **my projects, education, skills, engineering work, or public contact details**."),
        mode: 'portfolio',
        notice: 'The local model generated a draft, but the grounding gate blocked unsupported wording.',
        sources,
        model: activeModelId || undefined,
      };
    }

    const answer = normalizeMarkdown(draft);
    emit({ event: 'complete', data: `Fresh model response ready · ${activeModelId || PRIMARY_MODEL_ID}.` });
    return {
      answer,
      mode: 'verified-response',
      sources: [...sources, `${activeModelId || PRIMARY_MODEL_ID} · WebLLM · ${CONTEXT_WINDOW} context`],
      model: activeModelId || undefined,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    emit({ event: 'error', data: `Local generation unavailable: ${detail}` });
    emit({ event: 'complete', data: 'Generation could not be completed locally.' });
    return {
      answer: normalizeMarkdown(`# Local model unavailable 🔧\n\n## What happened\n- 🧠 I couldn’t initialize the on-device language model in this browser.\n- 📌 I’m not going to fake a model-written response by silently substituting canned text.\n\n---\n\n## Try again\n- Refresh the page and reopen the chat so WebGPU can initialize cleanly.`),
      mode: 'portfolio',
      notice: `Local WebLLM initialization failed: ${detail}`,
      sources,
    };
  }
}
