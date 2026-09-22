import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = 'openai/gpt-5.5';
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
    | 'model-loading'
    | 'model-ready'
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
  model?: string;
};

type ServerSseEvent = {
  type?: string;
  delta?: string;
  response?: unknown;
  answer?: string;
  result?: { response?: string; answer?: string };
  choices?: Array<{
    delta?: { content?: string };
    text?: string;
  }>;
  annotation?: unknown;
  annotations?: unknown;
  item?: unknown;
  output?: unknown;
  error?: { message?: string; code?: string };
  message?: string;
  code?: string;
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
    foundation: portfolioFacts.foundation,
    domains: portfolioFacts.domains,
    skills: portfolioFacts.skills,
    skillGroups: portfolioFacts.skillGroups,
    engineeringMethod: portfolioFacts.engineeringMethod,
    featuredSystems: portfolioFacts.featuredSystems,
    contact: portfolioFacts.contact,
  };

  if (
    /meera|model|inference|local ai|browser|llama|gguf|rag|qwen|electron|fastapi/.test(
      q,
    )
  ) {
    result.meeraAI = portfolioFacts.meeraAI;
  }

  const matched = portfolioFacts.projects.filter((p) => {
    const text =
      `${p.title} ${p.description} ${p.narrative} ${p.tags.join(' ')} ${p.buildNotes}`.toLowerCase();
    return text
      .split(/\W+/)
      .some((term) => term.length > 3 && q.includes(term));
  });

  result.projects = (matched.length ? matched : portfolioFacts.projects).map(
    ({ title, description, narrative, tags, buildNotes, githubUrl, page }) => ({
      title,
      description,
      narrative,
      tags,
      buildNotes,
      githubUrl: githubUrl === '#' ? undefined : githubUrl,
      page,
    }),
  );

  return JSON.stringify(result).slice(0, 30000);
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
    const text =
      `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();

    if (
      text
        .split(/\W+/)
        .some((term) => term.length > 3 && q.includes(term))
    ) {
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

function normalize(answer: string) {
  let text = answer.trim();

  text = text
    .replace(/^\s*#{1,6}\s*here[’']s the answer\s*👋\s*/i, '')
    .replace(/^\s*#{1,6}\s*here is the answer\s*👋\s*/i, '')
    .replace(/^\s*\`{3}(?:markdown|md)?\s*/i, '')
    .replace(/\s*\`{3}\s*$/i, '')
    .trim();

  return text;
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

function parseSseLine(
  line: string,
): ServerSseEvent | { type: 'text'; text: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('event:') || trimmed.startsWith('id:')) {
    return null;
  }

  const data = trimmed.startsWith('data:')
    ? trimmed.slice(5).trimStart()
    : trimmed;

  if (!data) return null;
  if (data === '[DONE]') return { type: 'done' };

  try {
    return JSON.parse(data) as ServerSseEvent;
  } catch {
    // Be tolerant of a plain-text streaming intermediary instead of turning
    // a usable model token into a fatal parser error.
    return { type: 'text', text: data };
  }
}

function extractStreamText(event: ServerSseEvent): string {
  const choice = event.choices?.[0];

  if (typeof choice?.delta?.content === 'string') {
    return choice.delta.content;
  }

  if (typeof choice?.text === 'string') {
    return choice.text;
  }

  if (typeof event.response === 'string') {
    return event.response;
  }

  // Backward-compatible path: an older deployed Worker may still return
  // one complete JSON response instead of SSE while the new Worker rolls out.
  if (typeof event.answer === 'string') {
    return event.answer;
  }

  if (typeof event.result?.response === 'string') {
    return event.result.response;
  }

  if (typeof event.result?.answer === 'string') {
    return event.result.answer;
  }

  return '';
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
      model?: string;
      streaming?: boolean;
      webSearch?: boolean;
      firstPartySources?: boolean;
    };

    return (
      data.ok === true &&
      data.streaming === true &&
      data.webSearch === true &&
      data.firstPartySources === true &&
      typeof data.model === 'string'
    );
  } catch {
    return false;
  }
}

export async function streamPortfolioQuestion(
  question: string,
  emit: (event: PortfolioStreamEvent) => void,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<RemotePortfolioAnswer> {
  const fallbackSources = defaultSources(question);

  emit({
    event: 'scope',
    data: 'Checking the question against first-party portfolio and GitHub sources.',
  });
  emit({
    event: 'retrieval',
    data: 'Fetching current portfolio and GitHub context, with live web search available.',
  });
  emit({
    event: 'model-loading',
    data: 'Opening a live server-side response stream…',
  });

  try {
    const response = await fetchWithTimeout(
      PORTFOLIO_AI_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          question,
          evidence: evidence(question),
          history: history.slice(-8),
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

    if (!response.body) {
      throw new Error('Remote AI did not provide a streaming response body.');
    }

    const headerSources = citationsFromHeader(
      response.headers.get('X-Portfolio-Sources'),
    );

    const sourceMap = new Map<string, PortfolioCitation>();
    for (const source of [...fallbackSources, ...headerSources]) {
      sourceMap.set(source.url, source);
      emit({
        event: 'citation',
        data: JSON.stringify(source),
      });
    }

    const activeModel =
      response.headers.get('X-Portfolio-Model') || MODEL_ID;

    emit({
      event: 'model-ready',
      data: `${activeModel} · live response stream connected`,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalAnswer = '';
    let streamFinished = false;

    const processEvent = (event: ServerSseEvent | { type: 'text'; text: string }) => {
      if (event.type === 'done') {
        streamFinished = true;
        return;
      }

      if (event.type === 'text') {
        if (event.text) {
          finalAnswer += event.text;
          emit({ event: 'token', data: event.text });
        }
        return;
      }

      if (event.type === 'error' || event.type === 'response.failed') {
        throw new Error(
          event.error?.message ||
            event.message ||
            'Remote AI streaming failed.',
        );
      }

      const citationMap = new Map<string, PortfolioCitation>();
      collectCitations(event, citationMap);

      for (const citation of citationMap.values()) {
        sourceMap.set(citation.url, citation);
        emit({
          event: 'citation',
          data: JSON.stringify(citation),
        });
      }

      const type = event.type || '';

      if (
        type === 'response.completed' ||
        type === 'response.done'
      ) {
        streamFinished = true;
        return;
      }

      const text = extractStreamText(event);
      if (text && type !== 'response.output_text.done') {
        finalAnswer += text;
        emit({ event: 'token', data: text });
      }
    };

    while (!streamFinished) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const normalized = buffer.replace(/\\r\\n/g, '\\n');
      const lines = normalized.split('\\n');

      buffer = lines.pop() || '';

      for (const line of lines) {
        const event = parseSseLine(line);
        if (!event) continue;

        processEvent(event);
        if (streamFinished) break;
      }
    }

    buffer += decoder.decode();

    if (!streamFinished && buffer.trim()) {
      const event = parseSseLine(buffer);
      if (event) processEvent(event);
    }

    const answer = normalize(finalAnswer);

    if (!answer) {
      throw new Error('Remote AI returned an empty streamed response.');
    }

    const sources = [...sourceMap.values()].slice(0, 10);

    emit({
      event: 'grounding',
      data: 'Answer generated from current first-party sources and, when needed, live web search.',
    });
    emit({
      event: 'complete',
      data: `Live stream complete · ${activeModel}`,
    });

    return {
      answer,
      mode: 'model-generated',
      sources,
      model: activeModel,
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
      answer: `# Remote AI is temporarily unavailable

The portfolio could not complete its live server-side AI request.

**Model:** ${MODEL_ID}

**Inference:** server-side · live web search + first-party portfolio/GitHub retrieval`,
      mode: 'error',
      notice: detail,
      sources: fallbackSources,
      model: MODEL_ID,
    };
  }
}
