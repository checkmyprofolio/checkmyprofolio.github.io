import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = '@cf/meta/llama-3.2-3b-instruct-v2';
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

  // Strip common emoji code-point ranges so older/cached generations
  // cannot pollute the professional UI. Avoid Unicode property escapes here
  // because some production parsing targets do not support them reliably.
  text = Array.from(text)
    .filter((char) => {
      const code = char.codePointAt(0) || 0;
      return !(
        (code >= 0x1f300 && code <= 0x1faff) ||
        (code >= 0x2600 && code <= 0x27bf)
      );
    })
    .join('');

  text = text
    .replace(/^\s*#{1,6}\s*here[’']s the answer\s*/i, '')
    .replace(/^\s*#{1,6}\s*here is the answer\s*/i, '')
    .replace(/^\s*\`{3}(?:markdown|md)?\s*/i, '')
    .replace(/\s*\`{3}\s*$/i, '')
    .trim();

  // Profolio AI should provide self-contained answers rather than trying to
  // keep the visitor in a conversational loop.
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

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

function parseSsePayload(
  buffer: string,
): {
  events: Array<ServerSseEvent | { type: 'text'; text: string }>;
  remainder: string;
} {
  const events: Array<ServerSseEvent | { type: 'text'; text: string }> = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    while (/\s/.test(buffer[cursor] || '')) cursor += 1;
    if (cursor >= buffer.length) break;

    if (buffer.startsWith('event:', cursor) || buffer.startsWith('id:', cursor)) {
      const newline = buffer.indexOf('\\n', cursor);
      if (newline === -1) return { events, remainder: buffer.slice(cursor) };
      cursor = newline + 1;
      continue;
    }

    // Accept both standard SSE and flattened streams where frames arrive
    // back-to-back with a "data:" marker but no newline separators.
    if (buffer.startsWith('data:', cursor)) {
      cursor += 5;
      while (/\s/.test(buffer[cursor] || '')) cursor += 1;
      if (cursor >= buffer.length) return { events, remainder: buffer.slice(cursor - 5) };
    }

    if (buffer.startsWith('[DONE]', cursor)) {
      events.push({ type: 'done' });
      cursor += '[DONE]'.length;
      continue;
    }

    if (buffer[cursor] !== '{') {
      const nextMarker = buffer.indexOf(' data:', cursor);
      const nextLine = buffer.indexOf('\\n', cursor);
      const cut =
        nextMarker === -1
          ? nextLine
          : nextLine === -1
            ? nextMarker
            : Math.min(nextMarker, nextLine);

      if (cut === -1) return { events, remainder: buffer.slice(cursor) };
      const plain = buffer.slice(cursor, cut).trim();
      if (plain) events.push({ type: 'text', text: plain });
      cursor = cut;
      continue;
    }

    // Extract one complete JSON object without depending on SSE line breaks.
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let i = cursor; i < buffer.length; i += 1) {
      const char = buffer[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    if (end === -1) {
      return { events, remainder: buffer.slice(cursor) };
    }

    const jsonText = buffer.slice(cursor, end);
    try {
      events.push(JSON.parse(jsonText) as ServerSseEvent);
    } catch {
      events.push({ type: 'text', text: jsonText });
    }
    cursor = end;
  }

  return { events, remainder: '' };
}

function normalizeCitation(value: unknown): PortfolioCitation | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Record<string, unknown>;
  const type = typeof item.type === 'string' ? item.type : '';

  const nested =
    item.url_citation && typeof item.url_citation === 'object'
      ? (item.url_citation as Record<string, unknown>)
      : null;

  const url =
    type === 'url_citation' && typeof item.url === 'string'
      ? item.url
      : typeof nested?.url === 'string'
        ? nested.url
        : '';

  if (!/^https?:\/\//i.test(url)) return null;

  const title =
    type === 'url_citation' && typeof item.title === 'string'
      ? item.title
      : typeof nested?.title === 'string'
        ? nested.title
        : (() => {
            try {
              return new URL(url).hostname.replace(/^www\\./, '');
            } catch {
              return url;
            }
          })();

  return {
    url,
    title,
    kind: 'web',
  };
}

function collectCitations(
  value: unknown,
  output: Map<string, PortfolioCitation>,
  depth = 0,
) {
  if (depth > 8 || value == null) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectCitations(item, output, depth + 1);
    }
    return;
  }

  if (typeof value !== 'object') return;

  const candidate = normalizeCitation(value);
  if (candidate) {
    output.set(candidate.url, candidate);
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    if (
      key === 'reasoning' ||
      key === 'reasoning_text' ||
      key === 'summary'
    ) {
      continue;
    }
    collectCitations(child, output, depth + 1);
  }
}

function citationsFromHeader(header: string | null): PortfolioCitation[] {
  if (!header) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(header)) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const source = item as Record<string, unknown>;
        if (
          typeof source.url !== 'string' ||
          !/^https?:\/\//i.test(source.url)
        ) {
          return null;
        }

        const kind =
          source.kind === 'portfolio' || source.kind === 'github'
            ? source.kind
            : 'web';

        return {
          url: source.url,
          title:
            typeof source.title === 'string'
              ? source.title
              : source.url,
          kind,
        } satisfies PortfolioCitation;
      })
      .filter((item): item is PortfolioCitation => Boolean(item));
  } catch {
    return [];
  }
}

function isTextEvent(
  event: ServerSseEvent | { type: 'text'; text: string },
): event is { type: 'text'; text: string } {
  return (
    event.type === 'text' &&
    'text' in event &&
    typeof event.text === 'string'
  );
}

function extractStreamText(event: ServerSseEvent): string {
  // Responses API streaming uses a top-level delta on response.output_text.delta.
  if (typeof event.delta === 'string') {
    return event.delta;
  }

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

    const initialSources = headerSources.length
      ? headerSources
      : fallbackSources;

    const sourceMap = new Map<string, PortfolioCitation>();
    for (const source of initialSources) {
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

      if (isTextEvent(event)) {
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
      const parsed = parseSsePayload(buffer);
      buffer = parsed.remainder;

      for (const event of parsed.events) {
        processEvent(event);
        if (streamFinished) break;
      }
    }

    buffer += decoder.decode();

    if (!streamFinished && buffer.trim()) {
      const parsed = parseSsePayload(buffer);
      for (const event of parsed.events) {
        processEvent(event);
        if (streamFinished) break;
      }
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
