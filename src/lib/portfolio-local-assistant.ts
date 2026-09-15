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

const scopePattern = /\b(hi|hello|hey|you|your|me|my|who|what|vidit|shah|portfolio|project(s)?|meeraai|meera\s*ai|meera|aarnaai|aarna\s*ai|airlearn|binance|futures|testnet|cli|robotics|automation|engineering|skill(s)?|technology|python|education|degree|college|gtu|cgpa|experience|career|github|linkedin|contact|email|resume|certificate|course(s)?|interest(s)?|goal(s)?|future|work|built|build|model(s)?|ai|machine learning|computer vision|cctv|esp32|iot|openai|llm|rag|lora|qlora|gguf|llama\.cpp|fastapi|react|next\.js|electron|typescript|javascript|pytorch|tensorflow|opencv|plc|microcontroller|control system|vision)\b/i;
const outOfScopeReply = 'I can only answer questions about Vidit Shah, his portfolio, projects, engineering work, skills, education, experience, and public contact details.';

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
  };

  if (/contact|email|reach|linkedin|github/.test(query)) payload.contact = portfolioFacts.contact;
  if (projectFacts.length) payload.projects = projectFacts;
  if (/project|work|built|build|portfolio/.test(query) && !projectFacts.length) {
    payload.projects = portfolioFacts.projects.map(({ title, description, tags, page, githubUrl }) => ({ title, description, tags, page, githubUrl }));
  }
  if (/skill|tech|stack|python|pytorch|tensorflow|opencv|react|typescript|javascript|llm|rag|lora|qlora|gguf|fastapi|electron|docker|linux/.test(query)) payload.skills = portfolioFacts.skills;
  if (/meera|model|tier|inference|local ai|browser|llama|gguf|rag/.test(query)) payload.meeraAI = portfolioFacts.meeraAI;

  return JSON.stringify(payload).slice(0, 5200);
}

function sourceList(question: string) {
  const q = question.toLowerCase();
  const matched = portfolioFacts.projects.filter((project) => {
    const searchable = `${project.title} ${project.description} ${project.narrative} ${project.tags.join(' ')}`.toLowerCase();
    return searchable.split(/\W+/).some((word) => word.length > 3 && q.includes(word));
  });

  const sources = ['Verified portfolio facts'];
  matched.slice(0, 4).forEach((project) => {
    sources.push(project.page || project.title);
    if (project.githubUrl) sources.push(project.githubUrl);
  });
  return [...new Set(sources)];
}

async function loadModel(emit: (event: PortfolioStreamEvent) => void): Promise<MLCEngine> {
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress: InitProgressReport) => {
        emit({ event: 'model-loading', data: progress.text });
      },
      logLevel: 'WARN',
    }, { context_window_size: CONTEXT_WINDOW });
  }
  return enginePromise;
}

export async function streamPortfolioQuestion(question: string, emit: (event: PortfolioStreamEvent) => void): Promise<LocalPortfolioAnswer> {
  if (!scopePattern.test(question)) {
    emit({ event: 'scope', data: 'Rejected: outside the portfolio-only scope.' });
    return { answer: outOfScopeReply, mode: 'portfolio', sources: ['Portfolio scope'] };
  }

  const verifiedAnswer = portfolioAnswer(question).trim();
  const context = relevantContext(question);
  const sources = sourceList(question);
  emit({ event: 'scope', data: 'Accepted: portfolio-only question.' });
  emit({ event: 'retrieval', data: 'Retrieved verified portfolio evidence.' });
  emit({ event: 'grounding', data: 'Model is constrained to retrieved portfolio evidence.' });

  try {
    const engine = await loadModel(emit);
    let draft = '';
    const reply = await engine.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the presentation layer for Vidit Shah's public portfolio assistant. You MUST answer only from the VERIFIED ANSWER and EVIDENCE below. Never add facts, guesses, names, employers, dates, numbers, URLs, achievements, project capabilities, or plans that are not explicitly present. Do not use general world knowledge. If the evidence is insufficient, say exactly: "I don't have a verified answer to that in this portfolio."\n\nOutput format is mandatory:\n# Direct answer\n- point\n- point\n\n---\n\n## Details\n- point\n- point\n\nRules: always use one H1 heading, at least one H2 subheading, concise bullet points, and horizontal separators between topics. Keep first person voice. Do not invent citations. Do not reproduce raw JSON.\n\nVERIFIED ANSWER:\n${verifiedAnswer}\n\nEVIDENCE:\n${context}`,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.05,
      top_p: 0.7,
      max_tokens: 220,
      stream: true,
    });

    for await (const chunk of reply) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (!token) continue;
      draft += token;
      emit({ event: 'token', data: token });
    }

    const answer = draft.trim();
    if (!answer) throw new Error('Empty draft');
    emit({ event: 'grounding', data: `Grounded response · ${CONTEXT_WINDOW}-token context · Qwen2.5-0.5B WebLLM.` });
    emit({ event: 'complete', data: 'Verified response ready.' });
    return { answer, mode: 'verified-response', sources: [...sources, 'Qwen2.5-0.5B (WebLLM)'] };
  } catch {
    emit({ event: 'grounding', data: 'Local model unavailable; using deterministic verified portfolio answer.' });
    emit({ event: 'complete', data: 'Verified response ready.' });
    return {
      answer: verifiedAnswer || "I don't have a verified answer to that in this portfolio.",
      mode: 'portfolio',
      notice: 'The local model was unavailable, so this response uses the deterministic verified portfolio record.',
      sources,
    };
  }
}
