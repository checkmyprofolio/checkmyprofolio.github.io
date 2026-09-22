import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = '@cf/meta/llama-3.2-3b-instruct';
export const CONTEXT_WINDOW = 80000;
export const PORTFOLIO_AI_ENDPOINT =
  process.env.NEXT_PUBLIC_PORTFOLIO_AI_ENDPOINT ||
  'https://checkmyprofolio-github-io.viditshah5656.workers.dev';

const REQUEST_TIMEOUT_MS = 25000;
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

  if (/meera|model|inference|local ai|browser|llama|gguf|rag|qwen|electron|fastapi/.test(q)) {
    result.meeraAI = portfolioFacts.meeraAI;
  }

  const matched = portfolioFacts.projects.filter((p) => {
    const text = `${p.title} ${p.description} ${p.narrative} ${p.tags.join(' ')} ${p.buildNotes}`.toLowerCase();
    return text.split(/\W+/).some((term) => term.length > 3 && q.includes(term));
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
    const text = `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
    if (text.split(/\W+/).some((term) => term.length > 3 && q.includes(term))) {
      if (p.page) sources.add(p.page);
      if (p.githubUrl && p.githubUrl !== '#') sources.add(p.githubUrl);
    }
  }

  return [...sources].slice(0, 7);
}

function normalize(answer: string) {
  const text = answer.trim();
  return /^#\s/m.test(text)
    ? text
    : `# Here’s the answer 👋\n\n${text}`;
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
      throw new Error(`Remote AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
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
      model?: string;
    };

    return data.ok === true && typeof data.model === 'string' && data.model.length > 0;
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
    data: 'Checking the portfolio question against verified evidence.',
  });
  emit({
    event: 'retrieval',
    data: 'Providing the relevant verified portfolio context.',
  });
  emit({
    event: 'model-loading',
    data: 'Sending the question to the remote GPU inference server…',
  });

  try {
    const response = await fetchWithTimeout(
      PORTFOLIO_AI_ENDPOINT,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          evidence: evidence(question),
          history: history.slice(-8),
          source: 'checkmyprofolio.github.io',
        }),
      },
      REQUEST_TIMEOUT_MS,
    );

    const rawBody = await response.text();

    let data: {
      answer?: string;
      model?: string;
      decision?: 'answer' | 'refuse';
      style?: string;
      evidenceConstrained?: boolean;
      error?: string;
      code?: string;
    } = {};

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        throw new Error(
          `Remote AI returned invalid JSON (HTTP ${response.status}).`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error
          ? `Remote AI server returned HTTP ${response.status}: ${data.error}`
          : `Remote AI server returned HTTP ${response.status}.`,
      );
    }

    if (!data.answer?.trim()) {
      throw new Error('Remote GPU model returned an empty response.');
    }

    emit({
      event: 'model-ready',
      data: `${data.model || MODEL_ID} · server-side inference · decision: ${data.decision || 'answer'} · style: ${data.style || 'direct'}`,
    });
    emit({ event: 'token', data: data.answer });
    emit({
      event: 'grounding',
      data: data.evidenceConstrained
        ? 'Answer constrained to verified portfolio evidence.'
        : 'Model response received.',
    });
    emit({ event: 'complete', data: 'Remote model response ready.' });

    return {
      answer: normalize(data.answer),
      mode: data.decision === 'refuse' ? 'scope' : 'model-generated',
      sources: [...sourceList(question), `${data.model || MODEL_ID} · remote GPU`],
      model: data.model || MODEL_ID,
    };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : String(error);

    emit({ event: 'error', data: detail });
    emit({ event: 'complete', data: 'Remote generation failed.' });

    return {
      answer: `# Remote AI is temporarily unavailable 🔧

## What happened
The portfolio tried to reach its server-side AI endpoint, but the request could not be completed.

## Server
- **Model:** ${MODEL_ID}
- **Inference:** remote GPU
- **Device WebGPU:** not required`,
      mode: 'error',
      notice: detail,
      sources: sourceList(question),
      model: MODEL_ID,
    };
  }
}
