import { portfolioFacts } from './portfolio-knowledge';

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

  const wantsProjects = /\b(?:project|projects|built|build|meeraai|meera|aarnaai|aarna|binance)\b/i.test(q);
  const wantsSkills = /\b(?:skill|skills|stack|technology|technologies|python|react|typescript|javascript|pytorch|tensorflow|opencv|fastapi|electron|llm|rag|lora|qlora|gguf)\b/i.test(q);
  const wantsEducation = /\b(?:education|degree|college|university|gtu|course|curriculum|cgpa|graduat)\b/i.test(q);
  const wantsContact = /\b(?:contact|email|linkedin|reach|github)\b/i.test(q);
  const wantsMeera = /\b(?:meeraai|meera|local ai|model|models|inference|browser|llama|qwen|gguf|rag)\b/i.test(q);
  const wantsDomains = /\b(?:robotics|automation|vision|control|plc|microcontroller|iot)\b/i.test(q);

  if (wantsEducation) result.education = portfolioFacts.foundation;
  if (wantsSkills) {
    result.skills = portfolioFacts.skills;
    result.skillGroups = portfolioFacts.skillGroups;
  }
  if (wantsDomains) result.domains = portfolioFacts.domains;
  if (wantsContact) result.contact = portfolioFacts.contact;

  if (wantsMeera) {
    result.meeraAI = {
      models: portfolioFacts.meeraAI.models,
      capabilities: portfolioFacts.meeraAI.capabilities,
      validation: portfolioFacts.meeraAI.validation,
    };
  }

  if (wantsProjects) {
    const matched = portfolioFacts.projects.filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.narrative} ${p.tags.join(' ')}`.toLowerCase();
      return haystack.split(/\W+/).some((term) => term.length > 3 && q.includes(term));
    });

    const sourceProjects = matched.length ? matched : portfolioFacts.projects;
    result.projects = sourceProjects.slice(0, 6).map(({ title, description, narrative, tags, buildNotes, githubUrl, page }) => ({
      title,
      description,
      narrative: matched.length ? narrative : undefined,
      tags,
      buildNotes: matched.length ? buildNotes : undefined,
      githubUrl: githubUrl === '#' ? undefined : githubUrl,
      page,
    }));
  }

  return JSON.stringify(result).slice(0, 6500);
}
function defaultSources(question: string): PortfolioCitation[] {
  const q = question.toLowerCase();
  const sources: PortfolioCitation[] = [
    {
      url: 'https://checkmyprofolio.github.io/',
      title: 'Vidit Shah — published portfolio',
      kind: 'portfolio',
    },
    {
      url: 'https://github.com/viditshah5656',
      title: 'Vidit Shah — GitHub profile',
      kind: 'github',
    },
  ];

  for (const p of portfolioFacts.projects) {
    const text = `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
    if (text.split(/\W+/).some((term) => term.length > 3 && q.includes(term))) {
      if (p.page) {
        sources.push({
          url: `https://checkmyprofolio.github.io${p.page}`,
          title: `${p.title} — portfolio`,
          kind: 'portfolio',
        });
      }
      if (p.githubUrl && p.githubUrl !== '#') {
        sources.push({
          url: p.githubUrl,
          title: `${p.title} — GitHub`,
          kind: 'github',
        });
      }
    }
  }

  return [...new Map(sources.map((source) => [source.url, source])).values()].slice(0, 8);
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

function normalize(answer: string) {
  let text = answer.trim();

  text = text
    .replace(/^\s*#{1,6}\s*here[’']s the answer\s*/i, '')
    .replace(/^\s*#{1,6}\s*here is the answer\s*/i, '')
    .replace(/^\s*`{3}(?:markdown|md)?\s*/i, '')
    .replace(/\s*`{3}\s*$/i, '')
    .trim();

  const lines = text.split(/\n+/);
  while (lines.length) {
    const last = lines[lines.length - 1].trim();
    if (
      /^(?:would you like|do you want|want me to|anything else|let me know|need more|shall i|can i help)/i.test(last) ||
      /^.*\b(?:would you like|do you want|want me to|anything else|let me know)\b.*\?\s*$/i.test(last)
    ) {
      lines.pop();
      continue;
    }
    break;
  }

  return enrichWithEmojis(
    lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
  );
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
    };

    return (
      data.ok === true &&
      data.firstPartySources === true
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

  // Handle lightweight social turns locally so greetings and acknowledgements
  // feel immediate instead of waiting for model inference.
  if (/^(?:hi|hello|hey|heyy|hey there|yo|sup|good morning|good afternoon|good evening)[!.\\s]*$/i.test(trimmed)) {
    const answer =
      "Hey! 👋 I’m Profolio AI, the assistant for Vidit’s public portfolio. I can help with his projects, engineering work, skills, education, and technical background.";
    emit({ event: 'complete', data: 'Immediate conversational response.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }

  if (/^(?:thanks|thank you|thx|ty|got it|okay|ok|cool|nice|great|perfect)[!.\\s]*$/i.test(trimmed)) {
    const answer = /^(?:thanks|thank you|thx|ty)/i.test(trimmed)
      ? "You’re welcome. Glad that helped."
      : "Got it.";
    emit({ event: 'complete', data: 'Immediate conversational response.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }

  if (
    /\b(?:birth date|birthdate|birthday|date of birth|dob)\b/i.test(trimmed) &&
    !Object.prototype.hasOwnProperty.call(identity, 'birthDate') &&
    !Object.prototype.hasOwnProperty.call(identity, 'dateOfBirth')
  ) {
    const answer =
      "### Personal detail\\nI don’t have Vidit’s birth date in the published portfolio or GitHub sources, so I don’t want to guess.";
    emit({ event: 'complete', data: 'Unsupported personal detail declined.' });
    return { answer, mode: 'model-generated', sources: fallbackSources };
  }


  emit({
    event: 'scope',
    data: 'Preparing a direct portfolio answer.',
  });
  emit({
    event: 'retrieval',
    data: 'Using published portfolio evidence for this question.',
  });
  emit({
    event: 'retrieval',
    data: 'Generating a direct response.',
  });

  try {
    const response = await fetchWithTimeout(
      PORTFOLIO_AI_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
      let message = `Remote AI server returned HTTP ${response.status}.`;

      if (rawError) {
        try {
          const parsed = JSON.parse(rawError) as { error?: string };
          if (parsed.error) message += ` ${parsed.error}`;
        } catch {
          message += ` ${rawError.slice(0, 180)}`;
        }
      }

      throw new Error(message);
    }

    const payload = (await response.json()) as {
      answer?: unknown;
      mode?: 'model-generated' | 'scope' | 'error';
      notice?: string;
      sources?: PortfolioCitation[];
    };

    const answer =
      typeof payload.answer === 'string' ? normalize(payload.answer) : '';

    if (!answer) {
      throw new Error('Remote AI returned an empty response.');
    }

    const sources =
      Array.isArray(payload.sources) && payload.sources.length
        ? payload.sources.filter((source) => source?.url)
        : fallbackSources;



    emit({
      event: 'complete',
      data: 'Response ready.',
    });
    emit({
      event: 'grounding',
      data: 'Answer generated from published portfolio evidence.',
    });
    emit({
      event: 'complete',
      data: 'Response complete.',
    });

    return {
      answer,
      mode: payload.mode || 'model-generated',
      notice: payload.notice,
      sources,
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error);

    emit({ event: 'error', data: detail });
    emit({
      event: 'complete',
      data: 'Remote generation failed.',
    });

    return {
      answer: `# Profolio AI is temporarily unavailable

The assistant could not complete this request. Please try again shortly.`,
      mode: 'error',
      notice: 'The assistant could not complete the request.',
      sources: fallbackSources,
    };
  }
}
