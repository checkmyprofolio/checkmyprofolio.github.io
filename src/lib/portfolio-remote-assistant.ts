import { portfolioFacts } from './portfolio-knowledge';

export const MODEL_ID = '@cf/meta/llama-3.2-1b-instruct';
export const CONTEXT_WINDOW = 60000;
export const PORTFOLIO_AI_ENDPOINT =
  process.env.NEXT_PUBLIC_PORTFOLIO_AI_ENDPOINT || 'https://checkmyprofolio-github-io.viditshah5656.workers.dev';

export type PortfolioStreamEvent = {
  event: 'scope'|'retrieval'|'model-loading'|'model-ready'|'token'|'grounding'|'complete'|'error';
  data: string;
};
export type RemotePortfolioAnswer = {
  answer: string;
  mode: 'model-generated'|'scope'|'error';
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
    return text.split(/\\W+/).some((term) => term.length > 3 && q.includes(term));
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
    if (text.split(/\\W+/).some((term) => term.length > 3 && q.includes(term))) {
      if (p.page) sources.add(p.page);
      if (p.githubUrl && p.githubUrl !== '#') sources.add(p.githubUrl);
    }
  }
  return [...sources].slice(0, 7);
}

function normalize(answer: string) {
  const text = answer.trim();
  return /^#\\s/m.test(text) ? text : `# Here’s the answer 👋\\n\\n${text}`;
}

export async function streamPortfolioQuestion(
  question: string,
  emit: (event: PortfolioStreamEvent) => void,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<RemotePortfolioAnswer> {
  emit({ event: 'scope', data: 'The remote LLM is deciding whether this question is answerable.' });
  emit({ event: 'retrieval', data: 'Providing the relevant verified portfolio context.' });
  emit({ event: 'model-loading', data: 'Sending the question to the remote GPU inference server…' });

  try {
    const response = await fetch(PORTFOLIO_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        evidence: evidence(question),
        history: history.slice(-8),
        source: 'checkmyprofolio.github.io',
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Remote AI server returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`,
      );
    }

    const data = await response.json() as {
      answer?: string;
      model?: string;
      decision?: 'answer' | 'refuse';
      style?: string;
      evidenceConstrained?: boolean;
    };

    if (!data.answer?.trim()) throw new Error('Remote GPU model returned an empty response.');

    emit({
      event: 'model-ready',
      data: `${data.model || MODEL_ID} · server-side inference · decision: ${data.decision || 'unknown'} · style: ${data.style || 'auto'}`,
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
    const detail = error instanceof Error ? error.message : String(error);
    emit({ event: 'error', data: detail });
    emit({ event: 'complete', data: 'Remote generation failed.' });

    return {
      answer: `# Remote AI is not connected yet 🔧

## What happened
- The portfolio is configured for **server-side inference**.
- The model is **not downloaded or executed on this device**.
- The remote inference endpoint could not be reached.

---

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
