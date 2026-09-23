import { portfolioFacts, privateProjectContext } from './portfolio-knowledge';
import { PORTFOLIO_LINKS, PORTFOLIO_ORIGIN, PORTFOLIO_ROUTES, canonicalizePortfolioUrl, isTrustedPortfolioUrl } from './portfolio-links';

export const CONTEXT_WINDOW = 80000;
export const PORTFOLIO_AI_ENDPOINT =
  process.env.NEXT_PUBLIC_PORTFOLIO_AI_ENDPOINT ||
  'https://checkmyprofolio-github-io.viditshah5656.workers.dev';

const REQUEST_TIMEOUT_MS = 30000;
const HEALTH_TIMEOUT_MS = 6000;

export type PortfolioCitation = {
  url: string;
  title: string;
  kind: 'web' | 'portfolio' | 'github';
};

export type PortfolioStreamEvent = {
  event:
    | 'scope'
    | 'retrieval'
    | 'token'
    | 'citation'
    | 'grounding'
    | 'complete'
    | 'error';
  data: string;
};

export type RemotePortfolioAnswer = {
  answer: string;
  mode: 'model-generated' | 'scope' | 'error';
  notice?: string;
  sources: PortfolioCitation[];
};

function evidence(question: string): string {
  const q = question.toLowerCase();
  const identity = portfolioFacts.identity;

  const result: Record<string, unknown> = {
    site: {
      origin: PORTFOLIO_ORIGIN,
      navigation: portfolioFacts.navigation,
      links: portfolioFacts.links,
    },
    identity: {
      name: identity.name,
      title: identity.title,
      statement: identity.statement,
      degree: identity.degree,
      university: identity.university,
      institution: identity.institution,
      graduation: identity.graduation,
      cgpa: identity.cgpa,
    },
  };

  const asksForAllProjects = /\b(?:all|every|each|complete|entire|whole|full)\b[\s\S]{0,60}\b(?:project|projects|work|things)\b/i.test(q)
    || /\b(?:project|projects|work)\b[\s\S]{0,60}\b(?:all|every|each|complete|entire|whole|full)\b/i.test(q)
    || /\b(?:list|catalog|collection|overview|portfolio)\b[\s\S]{0,30}\b(?:project|projects|work|things)\b/i.test(q)
    || /\b(?:what|which)\b[\s\S]{0,20}\b(?:have|has)\b[\s\S]{0,20}\b(?:built|created|made|worked on)\b/i.test(q);
  const wantsProjects = /\b(?:project|projects|built|build|meeraai|meera|aarnaai|aarna|binance|gemini|profolio|vision)\b/i.test(q) || asksForAllProjects;
  const wantsSkills = /\b(?:skill|skills|stack|technology|technologies|python|react|typescript|javascript|pytorch|tensorflow|opencv|fastapi|electron|llm|rag|lora|qlora|gguf)\b/i.test(q);
  const wantsEducation = /\b(?:education|degree|college|university|gtu|course|curriculum|cgpa|graduat)\b/i.test(q);
  const wantsContact = /\b(?:contact|email|linkedin|reach|github|orcid|social|link|links)\b/i.test(q);
  const wantsMeera = /\b(?:meeraai|meera|local ai|model|models|inference|browser|llama|qwen|gguf|rag|mcp|playwright|electron)\b/i.test(q);
  const wantsDomains = /\b(?:robotics|automation|vision|control|plc|microcontroller|iot|machine learning|software engineering|api)\b/i.test(q);
  const wantsSite = /\b(?:website|site|portfolio|page|pages|navigate|navigation|section|sections|link|links|redirect|homepage|dashboard|profile|contact)\b/i.test(q);

  if (wantsSite) result.site = { origin: PORTFOLIO_ORIGIN, navigation: portfolioFacts.navigation, links: portfolioFacts.links };
  if (wantsEducation) result.education = portfolioFacts.foundation;
  if (wantsSkills) {
    result.skills = portfolioFacts.skills;
    result.skillGroups = portfolioFacts.skillGroups;
  }
  if (wantsDomains) result.domains = portfolioFacts.domains;
  if (wantsContact) result.contact = portfolioFacts.contact;
  if (wantsMeera) result.meeraAI = portfolioFacts.meeraAI;

  if (wantsProjects) {
    const projectCatalog = portfolioFacts.featuredSystems.map((p) => ({
      id: p.id,
      title: p.title,
      visibility: p.visibility,
      evidenceLevel: p.level,
      purpose: p.problem,
      approach: p.approach,
      architecture: p.architecture,
      technologies: p.technologies,
      engineeringDecisions: p.decisions,
      evidence: p.evidence,
      limitations: p.limitations,
      nextStep: p.nextStep,
      verifiedGitHub: p.visibility === 'public' ? p.source : undefined,
      verifiedLiveSite: p.liveUrl,
      portfolioPage: p.page ? `${PORTFOLIO_ORIGIN}${p.page}` : undefined,
    }));
    result.projectCatalog = projectCatalog;
    result.privateProjectContext = privateProjectContext;
    result.projectAnswerRules = {
      public: 'Only projects explicitly marked public may receive their verifiedGitHub or verifiedLiveSite links.',
      private: 'Private/personal projects may be described using the supplied privateProjectContext, but never receive guessed repository URLs.',
      exploration: 'Exploration items are clearly labeled as exploration/research direction, not presented as completed public projects.',
      completeRequest: 'For a complete/all-project request, cover every catalog entry and group by visibility. Do not rank, select, or promote a single project.',
    };
  }

  return JSON.stringify(result).slice(0, asksForAllProjects ? 24000 : 20000);
}
function defaultSources(question: string): PortfolioCitation[] {
  const q = question.toLowerCase();
  const projectIntent = /\b(?:project|projects|built|build|work|meeraai|meera|aarnaai|airlearn|cctv|surveillance|youtube music|music automation|iot|esp32|gemini|web2api|infera|omniroute|binance|profolio|aerosynth|photogrammetry|drone reconstruction)\b/i.test(q);
  if (projectIntent) {
    const sources: PortfolioCitation[] = [{ url: `${PORTFOLIO_ORIGIN}/projects`, title: 'Portfolio — Projects', kind: 'portfolio' }];
    for (const p of portfolioFacts.featuredSystems) {
      const haystack = `${p.id} ${p.title} ${p.problem} ${p.categories.join(' ')} ${p.technologies.join(' ')}`.toLowerCase();
      const matched = q.split(/\W+/).some((token) => token.length > 3 && haystack.includes(token));
      if (!matched && q.length > 0) continue;
      if (p.visibility === 'public' && p.source) sources.push({ url: p.source, title: `${p.title} — GitHub`, kind: 'github' });
      if (p.liveUrl) sources.push({ url: p.liveUrl, title: `${p.title} — live site`, kind: 'portfolio' });
      if (p.page) sources.push({ url: `${PORTFOLIO_ORIGIN}${p.page}`, title: `${p.title} — portfolio walkthrough`, kind: 'portfolio' });
    }
    return [...new Map(sources.map((source) => [source.url, source])).values()].slice(0, 8);
  }
  return [
    { url: PORTFOLIO_ORIGIN, title: 'Vidit Shah — published portfolio', kind: 'portfolio' },
    { url: PORTFOLIO_LINKS.github, title: 'Vidit Shah — GitHub profile', kind: 'github' },
    { url: PORTFOLIO_LINKS.linkedin, title: 'Vidit Shah — LinkedIn', kind: 'web' },
  ];
}
function emojiFor(text: string, fallback = '✨') {
  const value = text.toLowerCase();
  if (/\b(?:meeraai|ai|llm|model|inference|rag|qwen|llama)\b/.test(value)) return '🧠';
  if (/\b(?:project|projects|built|build|architecture|system)\b/.test(value)) return '🚀';
  if (/\b(?:skill|skills|stack|technology|technologies|python|typescript|javascript|react|fastapi|electron)\b/.test(value)) return '💻';
  if (/\b(?:education|degree|college|university|cgpa|graduat|course|curriculum)\b/.test(value)) return '🎓';
  if (/\b(?:robotics|robot|automation|vision|control|plc|microcontroller|iot)\b/.test(value)) return '🤖';
  if (/\b(?:github|repository|repo|code|source)\b/.test(value)) return '🔧';
  if (/\b(?:contact|email|linkedin|reach)\b/.test(value)) return '📫';
  if (/\b(?:about|vidit|profile|background)\b/.test(value)) return '👋';
  return fallback;
}

function hasEmoji(text: string) {
  return Array.from(text).some((char) => {
    const code = char.codePointAt(0) || 0;
    return (
      (code >= 0x1f300 && code <= 0x1faff) ||
      (code >= 0x2600 && code <= 0x27bf)
    );
  });
}

function enrichWithEmojis(answer: string) {
  const lines = answer.split('\n');
  const output: string[] = [];
  let codeBlock = false;
  let emojiCount = 0;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('```')) {
      codeBlock = !codeBlock;
      output.push(raw);
      continue;
    }

    if (codeBlock || !line) {
      output.push(raw);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const title = Array.from(heading[2])
        .filter((char) => {
          const code = char.codePointAt(0) || 0;
          return !(
            (code >= 0x1f300 && code <= 0x1faff) ||
            (code >= 0x2600 && code <= 0x27bf)
          );
        })
        .join('')
        .trim();
      const emoji = emojiFor(title, emojiCount % 2 ? '✨' : '🚀');
      output.push(`${heading[1]} ${title} ${emoji}`);
      emojiCount += 1;
      continue;
    }

    const bullet = line.match(/^([-*+])\s+(.+)$/);
    if (bullet && emojiCount < 8) {
      const bulletText = bullet[2];
      const decorated = hasEmoji(bulletText)
        ? bulletText
        : `${emojiFor(bulletText)} ${bulletText}`;
      output.push(`${bullet[1]} ${decorated}`);
      if (!hasEmoji(bulletText)) emojiCount += 1;
      continue;
    }

    output.push(raw);
  }

  if (!hasEmoji(output.join('\n'))) {
    const firstContent = output.findIndex((line) => line.trim().length > 0);
    if (firstContent >= 0) {
      output[firstContent] = `${emojiFor(output[firstContent])} ${output[firstContent]}`;
    }
  }

  return output.join('\n');
}

function addRelevantLinks(answer: string, _question: string) { return answer; }
function sanitizeAssistantLinks(text: string) {
  const rewrite = (url: string) => {
    const canonical = canonicalizePortfolioUrl(url);
    return isTrustedPortfolioUrl(canonical) ? canonical : '';
  };

  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    (_match, label: string, url: string) => {
      const canonical = rewrite(url);
      return canonical ? `[${label}](${canonical})` : label;
    },
  );

  return text.replace(
    /https?:\/\/[^\s)]+/g,
    (url) => rewrite(url),
  );
}

export type PortfolioNavigationTarget = {
  label: string;
  href: string;
  kind: 'internal' | 'external';
};

export function resolvePortfolioNavigation(question: string): PortfolioNavigationTarget | null {
  const q = question.trim().toLowerCase();
  const action = /\b(?:open|go|take me|navigate|visit|redirect|show me|bring me|send me|jump to|view)\b/i.test(q);
  if (!action) return null;

  if (/\b(?:linkedin|linked\s*in)\b/.test(q)) {
    return { label: 'LinkedIn', href: PORTFOLIO_LINKS.linkedin, kind: 'external' };
  }
  if (/\b(?:github|git hub|repositories|repository|source code)\b/.test(q)) {
    if (/\b(?:binance|futures\s+testnet|trading\s+bot)\b/.test(q)) {
      return { label: 'Binance Futures Testnet CLI on GitHub', href: PORTFOLIO_LINKS.binanceCli, kind: 'external' };
    }
    return { label: 'GitHub', href: PORTFOLIO_LINKS.github, kind: 'external' };
  }
  if (/\b(?:orcid)\b/.test(q)) {
    return { label: 'ORCID', href: PORTFOLIO_LINKS.orcid, kind: 'external' };
  }
  if (/\b(?:email|mail)\b/.test(q)) {
    return { label: 'email', href: PORTFOLIO_LINKS.email, kind: 'external' };
  }
  if (/\b(?:meeraai|meera\s+browser|desktop\s+assistant)\b/.test(q)) {
    return { label: 'MeeraAI', href: PORTFOLIO_ROUTES.meeraAI, kind: 'internal' };
  }
  if (/\b(?:project|projects|work|portfolio\s+work)\b/.test(q)) {
    return { label: 'Projects', href: PORTFOLIO_ROUTES.projects, kind: 'internal' };
  }
  if (/\b(?:dashboard|overview|engineering\s+overview|skills\s+dashboard)\b/.test(q)) {
    return { label: 'Overview', href: PORTFOLIO_ROUTES.dashboard, kind: 'internal' };
  }
  if (/\b(?:contact|reach\s+out|message)\b/.test(q)) {
    return { label: 'Contact', href: PORTFOLIO_ROUTES.contact, kind: 'internal' };
  }
  if (/\b(?:profile|about\s+vidit|about\s+me|bio)\b/.test(q)) {
    return { label: 'Profile', href: PORTFOLIO_ROUTES.profile, kind: 'internal' };
  }
  if (/\b(?:home|homepage|landing\s+page|start)\b/.test(q)) {
    return { label: 'Home', href: PORTFOLIO_ROUTES.home, kind: 'internal' };
  }

  return null;
}

function normalize(answer: string, question = '') {
  let text = answer.trim();

  // Small local models sometimes serialize Markdown line breaks as literal
  // backslash+n sequences (and occasionally double-escaped variants). Decode
  // those safely before the renderer sees the answer.
  text = text
    .replace(/\\+n/g, '\n')
    .replace(/\\+r/g, '')
    .replace(/\\+t/g, '\t')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/^\s*[=]{4,}\s*$/gm, '')
    .replace(/^\s*#{1,6}\s*here[’']s the answer\s*/i, '')
    .replace(/^\s*#{1,6}\s*here is the answer\s*/i, '')
    .replace(/^\s*`{3}(?:markdown|md)?\s*/i, '')
    .replace(/\s*`{3}\s*$/i, '')
    .trim();

  const knownHeading = /^(?:your\s+skills|vidit['’]s\s+projects|meeraai\s+overview|about\s+me|about\s+profolio\s+ai|technical\s+details|key\s+features|education|experience|skills|projects|professional\s+background)\b\s*:?[\s\S]*$/i;
  const lines = text
    .split('\n')
    .map((line) => line.trimEnd());

  // Promote common one-line model titles to Markdown headings when the model
  // omitted the # markers.
  for (let i = 0; i < lines.length; i += 1) {
    const value = lines[i].trim();
    if (!value || /^#{1,6}\s/.test(value)) continue;

    if (/^(?:your\s+skills|vidit['’]s\s+projects|meeraai\s+overview|about\s+me|about\s+profolio\s+ai)\b/i.test(value)) {
      lines[i] = `## ${value}`;
    } else if (/^(?:technical\s+details|key\s+features|education|experience|skills|projects|professional\s+background)\s*:?[\s]*$/i.test(value)) {
      lines[i] = `### ${value.replace(/:$/, '')}`;
    }
  }

  // Split adjacent bullet markers if the model omitted a newline between them.
  text = lines
    .join('\n')
    .replace(/\s+([-*+])\s+(?=[A-Za-z0-9🔧🤖🧠🚀💻🎓])/g, '\n$1 ');

  const cleanLines = text.split('\n');
  while (cleanLines.length) {
    const last = cleanLines[cleanLines.length - 1].trim();
    if (
      /^(?:would you like|do you want|want me to|anything else|let me know|need more|shall i|can i help)/i.test(last) ||
      /^.*\b(?:would you like|do you want|want me to|anything else|let me know)\b.*\?\s*$/i.test(last)
    ) {
      cleanLines.pop();
      continue;
    }
    break;
  }

  const normalized = cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  let orderedNumber = 0;
  const renumbered = normalized.split('\n').map((line) => {
    const match = line.match(/^\s*\d+\.\s+(.+)$/);
    if (!match) return line;
    orderedNumber += 1;
    return `${orderedNumber}. ${match[1]}`;
  }).join('\n');
  return addRelevantLinks(enrichWithEmojis(sanitizeAssistantLinks(renumbered)), question);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `Remote AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

type StreamPayload = {
  response?: unknown;
  answer?: unknown;
  delta?: unknown;
  token?: unknown;
  choices?: Array<{
    delta?: { content?: unknown };
    text?: unknown;
    message?: { content?: unknown };
  }>;
  annotations?: unknown;
  annotation?: unknown;
};

function streamText(payload: StreamPayload): string {
  if (typeof payload.response === 'string') return payload.response;
  if (typeof payload.answer === 'string') return payload.answer;
  if (typeof payload.delta === 'string') return payload.delta;
  if (typeof payload.token === 'string') return payload.token;
  const first = payload.choices?.[0];
  if (typeof first?.delta?.content === 'string') return first.delta.content;
  if (typeof first?.text === 'string') return first.text;
  if (typeof first?.message?.content === 'string') return first.message.content;
  return '';
}

function streamCitations(payload: StreamPayload): PortfolioCitation[] {
  const output: PortfolioCitation[] = [];
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    const item = value as Record<string, unknown>;
    const nested = item.url_citation;
    const nestedRecord = nested && typeof nested === 'object'
      ? (nested as Record<string, unknown>)
      : null;
    const url =
      typeof item.url === 'string'
        ? item.url
        : typeof nestedRecord?.url === 'string'
          ? nestedRecord.url
          : '';
    if (/^https?:\/\//i.test(url)) {
      output.push({
        url,
        title:
          typeof item.title === 'string'
            ? item.title
            : typeof nestedRecord?.title === 'string'
              ? nestedRecord.title
              : url,
        kind: 'web',
      });
    }
    Object.values(item).forEach(walk);
  };
  walk(payload.annotations);
  walk(payload.annotation);
  return [...new Map(output.map((item) => [item.url, item])).values()];
}

function parseSseData(data: string): StreamPayload | null {
  try {
    return JSON.parse(data) as StreamPayload;
  } catch {
    return null;
  }
}
export async function checkPortfolioAI(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      PORTFOLIO_AI_ENDPOINT,
      { method: 'GET', cache: 'no-store' },
      HEALTH_TIMEOUT_MS,
    );

    if (!response.ok) return false;

    const data = (await response.json()) as {
      ok?: boolean;
      firstPartySources?: boolean;
      responseFormat?: string;
    };

    return (
      data.ok === true &&
      data.firstPartySources === true &&
      data.responseFormat === 'stream'
    );
  } catch {
    return false;
  }
}


function isRuntimePrivacyQuestion(question: string) {
  return /\b(?:what(?:'s| is)?\s+(?:your|the)\s+(?:model|llm|backend|provider|runtime|engine|stack)|which\s+(?:model|llm|provider|engine)|what\s+(?:model|llm|provider)\s+do\s+you\s+use|what\s+(?:powers|runs|drives)\s+you\s+(?:on|with)|what\s+(?:are|is)\s+your\s+(?:backend|model|provider)|what\s+(?:powers|runs|drives)\s+(?:this|the)\s+(?:chat|assistant|portfolio\s+ai)|which\s+model\s+powers\s+you|are\s+you\s+(?:llama|gpt|gemma|mistral)|underlying\s+(?:model|llm|provider|backend)|backend\s+model|backend\s+stack|model\s+name|tell\s+me\s+(?:your|the)\s+(?:model|backend|provider|runtime))\b/i.test(
    question,
  );
}

function runtimePrivacyAnswer(): RemotePortfolioAnswer {
  return {
    answer:
      "## Profolio AI privacy 🔒\nI keep my underlying model, provider, and backend implementation details private. I can explain my capabilities and the information available in Vidit's public portfolio, but I do not expose the runtime technology behind this assistant.",
    mode: 'scope',
    sources: defaultSources(''),
  };
}

export async function streamPortfolioQuestion(
  question: string,
  emit: (event: PortfolioStreamEvent) => void,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<RemotePortfolioAnswer> {
  const fallbackSources = defaultSources(question);
  const trimmed = question.trim();

  if (isRuntimePrivacyQuestion(trimmed)) {
    return runtimePrivacyAnswer();
  }

  const identity = portfolioFacts.identity;
  if (/^(?:hi|hello|hey|heyy|hey there|yo|sup|good morning|good afternoon|good evening)[!.\s]*$/i.test(trimmed)) {
    const answer = 'Hey! 👋 I’m Profolio AI, the assistant for Vidit’s public portfolio. I can help with his projects, engineering work, skills, education, and technical background.';
    emit({ event: 'complete', data: 'Immediate conversational response.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }

  if (/^(?:thanks|thank you|thx|ty|got it|okay|ok|cool|nice|great|perfect)[!.\s]*$/i.test(trimmed)) {
    const answer = /^(?:thanks|thank you|thx|ty)/i.test(trimmed)
      ? 'You’re welcome. Glad that helped.'
      : 'Got it.';
    emit({ event: 'complete', data: 'Immediate conversational response.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }

  if (
    /\b(?:birth date|birthdate|birthday|date of birth|dob)\b/i.test(trimmed) &&
    !Object.prototype.hasOwnProperty.call(identity, 'birthDate') &&
    !Object.prototype.hasOwnProperty.call(identity, 'dateOfBirth')
  ) {
    const answer = '### Personal detail\nI don’t have Vidit’s birth date in the published portfolio or GitHub sources, so I don’t want to guess.';
    emit({ event: 'complete', data: 'Unsupported personal detail declined.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }

  const specificProjectMention =
    /\b(?:meeraai|meera|aarnaai|aarna|airlearn|cctv|surveillance|youtube music|music automation|iot|esp32|gemini web2api|gemini|web2api|omniroute|binance|futures testnet|profolio)\b/i.test(trimmed);
  const asksForAllProjects =
    !specificProjectMention && (
      /\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview|portfolio)\b[\s\S]{0,80}\b(?:project|projects|work|things|built)\b/i.test(trimmed) ||
      /\b(?:project|projects|work)\b[\s\S]{0,80}\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview)\b/i.test(trimmed) ||
      /\b(?:what|which)\b[\s\S]{0,30}\b(?:have|has|did)\b[\s\S]{0,30}\b(?:built|created|made|worked on)\b/i.test(trimmed) ||
      /\b(?:tell|explain|describe)\b[\s\S]{0,30}\b(?:me|us)\b[\s\S]{0,30}\b(?:about|regarding)\b[\s\S]{0,30}\b(?:his|vidit['’]s|the)\b[\s\S]{0,20}\b(?:project|projects|work)\b/i.test(trimmed)
    );

  const asksForProfile = !specificProjectMention && /\b(?:who|about|introduce|introduction|tell me about|describe)\b/i.test(trimmed) && !/\b(?:project|projects)\b/i.test(trimmed);

  if (asksForProfile) {
    const answer = normalize(portfolioAnswer(trimmed), trimmed);
    emit({ event: 'scope', data: 'Using the structured portfolio profile.' });
    emit({ event: 'grounding', data: 'Profile response uses the portfolio knowledge base.' });
    emit({ event: 'complete', data: 'Profile response complete.' });
    return {
      answer,
      mode: 'scope',
      sources: fallbackSources,
    };
  }

  if (asksForAllProjects) {
    const answer = normalize(portfolioAnswer(trimmed), trimmed);
    emit({ event: 'scope', data: 'Using the complete public/private project catalog.' });
    emit({ event: 'grounding', data: 'All recorded projects are grouped by visibility and evidence status.' });
    emit({ event: 'complete', data: 'Complete project catalog response.' });
    return {
      answer,
      mode: 'scope',
      sources: fallbackSources,
    };
  }

  emit({ event: 'scope', data: 'Preparing a direct portfolio answer.' });
  emit({ event: 'retrieval', data: 'Using published portfolio evidence for this question.' });
  emit({ event: 'retrieval', data: 'Generating your answer…' });

  try {
    const response = await fetchWithTimeout(
      PORTFOLIO_AI_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          question,
          evidence: evidence(question),
          history: history.slice(-2),
          source: 'checkmyprofolio.github.io',
        }),
      },
      REQUEST_TIMEOUT_MS,
    );

    if (!response.ok) {
      const rawError = await response.text().catch(() => '');
      let message = 'Remote AI server returned HTTP ' + response.status + '.';
      if (rawError) {
        try {
          const parsed = JSON.parse(rawError) as { error?: string };
          if (parsed.error) message += ' ' + parsed.error;
        } catch {
          message += ' ' + rawError.slice(0, 180);
        }
      }
      throw new Error(message);
    }

    const sourcesFromHeader = (() => {
      const header = response.headers.get('X-Portfolio-Sources');
      if (!header) return [] as PortfolioCitation[];
      try {
        const parsed = JSON.parse(decodeURIComponent(header)) as unknown[];
        return Array.isArray(parsed)
          ? parsed.filter((item): item is PortfolioCitation => Boolean(
              item &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>).url === 'string',
            ))
          : [];
      } catch {
        return [] as PortfolioCitation[];
      }
    })();

    if (!response.body || !(response.headers.get('content-type') || '').includes('text/event-stream')) {
      const payload = (await response.json()) as { answer?: unknown; mode?: 'model-generated' | 'scope' | 'error'; notice?: string; sources?: PortfolioCitation[] };
      const answer = typeof payload.answer === 'string' ? normalize(payload.answer, question) : '';
      if (!answer) throw new Error('Remote AI returned an empty response.');
      emit({ event: 'complete', data: 'Response complete.' });
      return {
        answer,
        mode: payload.mode || 'model-generated',
        notice: payload.notice,
        sources: payload.sources?.length ? payload.sources : (sourcesFromHeader.length ? sourcesFromHeader : fallbackSources),
      };
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';
    let fullAnswer = '';
    const citations = new Map<string, PortfolioCitation>();
    for (const source of sourcesFromHeader) citations.set(source.url, source);

    const processFrame = (frame: string) => {
      const dataLines = frame
        .replace(/\r/g, '')
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());
      if (!dataLines.length) return;
      const data = dataLines.join('\n').trim();
      if (!data || data === '[DONE]') return;
      const payload = parseSseData(data);
      if (!payload) return;
      const token = streamText(payload);
      if (token) {
        fullAnswer += token;
        emit({ event: 'token', data: token });
      }
      for (const citation of streamCitations(payload)) citations.set(citation.url, citation);
    };

    while (true) {
      const result = await reader.read();
      if (result.value) buffer += decoder.decode(result.value, { stream: true });
      if (result.done) {
        buffer += decoder.decode();
        break;
      }

      buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        processFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }

    if (buffer.trim()) processFrame(buffer);

    const answer = normalize(fullAnswer, question);
    if (!answer) throw new Error('Remote AI returned an empty response.');
    emit({ event: 'grounding', data: 'Answer generated from published portfolio evidence.' });
    emit({ event: 'complete', data: 'Response complete.' });

    return {
      answer,
      mode: 'model-generated',
      sources: citations.size ? [...citations.values()] : fallbackSources,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    emit({ event: 'error', data: detail });
    emit({ event: 'complete', data: 'Remote generation failed.' });
    return {
      answer: '# Profolio AI is temporarily unavailable\n\nThe assistant could not complete this request. Please try again shortly.',
      mode: 'error',
      notice: 'The assistant could not complete the request.',
      sources: fallbackSources,
    };
  }
}
