import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = '@cf/meta/llama-3.2-3b-instruct';
export const CONTEXT_WINDOW = 80000;
export const PORTFOLIO_AI_ENDPOINT =
  process.env.NEXT_PUBLIC_PORTFOLIO_AI_ENDPOINT ||
  'https://checkmyprofolio-github-io.viditshah5656.workers.dev';

const REQUEST_TIMEOUT_MS = 30000;
const HEALTH_TIMEOUT_MS = 6000;

export type PortfolioStreamEvent = {
  event:
    | 'scope'
    | 'retrieval'
    | 'model-loading'
    | 'model-ready'
    | 'token'
    | 'grounding'
    | 'complete'
    | 'error';
  data: string;
};

export type RemotePortfolioAnswer = {
  answer: string;
  mode: 'model-generated' | 'scope' | 'error';
  notice?: string;
  sources: string[];
  model?: string;
};

type ServerSseEvent = {
  type?: string;
  response?: string;
  result?: { response?: string };
  choices?: Array<{
    delta?: { content?: string };
    text?: string;
  }>;
  error?: string;
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

function sourceList(question: string): string[] {
  const q = question.toLowerCase();
  const sources = new Set<string>(['Verified portfolio record']);

  for (const p of portfolioFacts.projects) {
    const text =
      `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
    if (
      text
        .split(/\W+/)
        .some((term) => term.length > 3 && q.includes(term))
    ) {
      if (p.page) sources.add(p.page);
      if (p.githubUrl && p.githubUrl !== '#') sources.add(p.githubUrl);
    }
  }

  return [...sources].slice(0, 7);
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

  if (typeof event.result?.response === 'string') {
    return event.result.response;
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
    };

    return (
      data.ok === true &&
      data.streaming === true &&
      typeof data.model === 'string' &&
      data.model.length > 0
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
  emit({
    event: 'scope',
    data: 'Checking the question against verified portfolio evidence.',
  });
  emit({
    event: 'retrieval',
    data: 'Sending only the relevant portfolio context to the remote model.',
  });
  emit({
    event: 'model-loading',
    data: 'Opening a live server-side token stream…',
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

    emit({
      event: 'model-ready',
      data: `${MODEL_ID} · server-side SSE stream connected`,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalAnswer = '';
    let streamFinished = false;

    const handleEvent = (
      event: ServerSseEvent | { type: 'text'; text: string },
    ) => {
      if (event.type === 'done') {
        streamFinished = true;
        return;
      }

      if (event.type === 'error') {
        throw new Error(event.error || 'Remote AI streaming failed.');
      }

      const text =
        event.type === 'text' ? event.text : extractStreamText(event);

      if (text) {
        finalAnswer += text;
        emit({ event: 'token', data: text });
      }
    };

    const processCompleteLines = () => {
      const normalized = buffer.replace(/\r\n/g, '\n');
      const lines = normalized.split('\n');

      // Keep the final incomplete line for the next network chunk.
      buffer = lines.pop() || '';

      for (const line of lines) {
        const event = parseSseLine(line);
        if (!event) continue;
        handleEvent(event);
        if (streamFinished) break;
      }
    };

    while (!streamFinished) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      processCompleteLines();
    }

    buffer += decoder.decode();
    if (!streamFinished && buffer.trim()) {
      const event = parseSseLine(buffer);
      if (event) handleEvent(event);
    }

    const serverModel = MODEL_ID;
    const answer = normalize(finalAnswer);

    if (!answer) {
      throw new Error('Remote GPU model returned an empty streaming response.');
    }

    emit({
      event: 'grounding',
      data: 'Answer generated from verified portfolio evidence.',
    });
    emit({
      event: 'complete',
      data: `Remote token stream complete · ${serverModel}`,
    });

    return {
      answer,
      mode: 'model-generated',
      sources: [
        ...sourceList(question),
        `${serverModel} · remote GPU`,
      ],
      model: MODEL_ID,
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
      answer: `# Remote AI is temporarily unavailable 🔧

The portfolio could not complete its live server-side AI stream.

**Server model:** ${MODEL_ID}

**Inference:** remote GPU · browser does not download the model`,
      mode: 'error',
      notice: detail,
      sources: sourceList(question),
      model: MODEL_ID,
    };
  }
}
