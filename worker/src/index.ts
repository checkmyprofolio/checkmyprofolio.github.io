interface Env {
  AI: {
    run(
      model: string,
      input: Record<string, unknown>,
      options?: {
        gateway?: {
          id: string;
          skipCache?: boolean;
          cacheTtl?: number;
        };
      },
    ): Promise<ReadableStream<Uint8Array> | unknown>;
  };
}

type SourceKind = 'portfolio' | 'github';
type Source = {
  url: string;
  title: string;
  kind: SourceKind;
};

const MODEL = '@cf/meta/llama-3.2-3b-instruct-v2';
const FALLBACK_MODEL = MODEL;
const GATEWAY = 'default';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://checkmyprofolio.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Expose-Headers': 'X-Portfolio-Sources, X-Portfolio-Model, X-Portfolio-Web-Search',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function sourceHeader(sources: Source[]) {
  return encodeURIComponent(JSON.stringify(sources.slice(0, 8)));
}

function stripHtml(value: string) {
  return value
    .replace(new RegExp('<script[\s\S]*?</script>', 'gi'), ' ')
    .replace(new RegExp('<style[\s\S]*?</style>', 'gi'), ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max) + '\n[truncated]' : value;
}

async function fetchSource(
  source: Source,
  maxChars = 7000,
  init?: RequestInit,
): Promise<{ source: Source; text: string } | null> {
  try {
    const response = await fetch(source.url, {
      ...init,
      headers: {
        'User-Agent': 'checkmyprofolio-portfolio-ai/1.0',
        Accept: 'text/html,application/json,text/plain,*/*',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) return null;

    const raw = await response.text();
    const text = source.kind === 'portfolio' && /<html|<body/i.test(raw)
      ? stripHtml(raw)
      : raw.replace(/\s+/g, ' ').trim();

    if (!text) return null;

    return {
      source,
      text: truncate(text, maxChars),
    };
  } catch {
    return null;
  }
}

async function fetchFirstPartyContext(
  question: string,
): Promise<{ context: string; sources: Source[] }> {
  const q = question.toLowerCase();
  const portfolioQuestion =
    /\b(?:vidit|his|he|about me|about vidit|bio|biography|education|degree|cgpa|skills?|experience|career|projects?|built|builds|meeraai|meera|github|repository|repo)\b/i.test(
      q,
    );
  const broadProfileQuestion =
    /\b(?:vidit|about me|about vidit|bio|biography|education|degree|cgpa|skills?|experience|career)\b/i.test(
      q,
    );
  const projectQuestion =
    /\b(?:project|projects|built|build|meeraai|meera|github|repository|repo)\b/i.test(
      q,
    );

  // Keep non-portfolio/general questions fast: they do not need to wait on
  // first-party HTTP retrieval unless the visitor is asking about Vidit.
  if (!portfolioQuestion) {
    return { context: '', sources: [] };
  }

  const baseSources: Source[] = [
    {
      url: 'https://raw.githubusercontent.com/checkmyprofolio/checkmyprofolio.github.io/master/src/lib/engineering-profile.ts',
      title: 'Portfolio engineering profile source',
      kind: 'github',
    },
    {
      url: 'https://raw.githubusercontent.com/checkmyprofolio/checkmyprofolio.github.io/master/src/lib/data.ts',
      title: 'Portfolio profile and project data source',
      kind: 'github',
    },
  ];

  if (broadProfileQuestion) {
    baseSources.unshift({
      url: 'https://checkmyprofolio.github.io/',
      title: 'Vidit Shah — published portfolio',
      kind: 'portfolio',
    });
    baseSources.push({
      url: 'https://api.github.com/users/viditshah5656',
      title: 'Vidit Shah — GitHub profile',
      kind: 'github',
    });
  }

  if (projectQuestion) {
    baseSources.push({
      url: 'https://api.github.com/users/viditshah5656/repos?per_page=20&sort=updated',
      title: 'Vidit Shah — GitHub repositories',
      kind: 'github',
    });
  }

  const fetched = await Promise.all(
    baseSources.map((source) =>
      fetchSource(
        source,
        source.url.includes('/engineering-profile.ts')
          ? 5500
          : source.url.includes('/data.ts')
            ? 5000
            : source.url.includes('/repos?')
              ? 6000
              : source.url.includes('api.github.com/users/')
                ? 2500
                : 3500,
        source.url.includes('api.github.com')
          ? { headers: { Accept: 'application/vnd.github+json' } }
          : undefined,
      ),
    ),
  );

  const usable = fetched.filter(Boolean) as { source: Source; text: string }[];
  const reposEntry = usable.find((item) => item.source.url.includes('/repos?'));
  let repoReadmes: { source: Source; text: string }[] = [];

  if (reposEntry) {
    try {
      const repos = JSON.parse(reposEntry.text) as Array<{
        name?: string;
        full_name?: string;
        default_branch?: string;
      }>;

      const tokens = q
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4);

      const ranked = repos
        .filter((repo) => repo.name && repo.full_name && repo.default_branch)
        .map((repo) => {
          const name = repo.name!.toLowerCase();
          const score = tokens.reduce(
            (sum, token) => sum + (name.includes(token) ? 3 : 0),
            0,
          );
          return { repo, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 1);

      const candidates = ranked.length
        ? ranked
        : repos
            .filter((repo) => repo.name && repo.full_name && repo.default_branch)
            .slice(0, 1)
            .map((repo) => ({ repo, score: 0 }));

      repoReadmes = (
        await Promise.all(
          candidates.map(async ({ repo }) => {
            const source: Source = {
              url: `https://github.com/${repo.full_name}`,
              title: `${repo.name} — GitHub repository`,
              kind: 'github',
            };

            try {
              const response = await fetch(
                `https://api.github.com/repos/${repo.full_name}/readme`,
                {
                  headers: {
                    Accept: 'application/vnd.github.raw+json',
                    'User-Agent': 'checkmyprofolio-portfolio-ai/1.0',
                  },
                },
              );

              if (!response.ok) return null;

              const text = truncate((await response.text()).trim(), 4000);
              return text ? { source, text } : null;
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean) as { source: Source; text: string }[];
    } catch {
      // Keep base sources when the GitHub repository index is unavailable.
    }
  }

  const unique = new Map<string, { source: Source; text: string }>();
  for (const item of [...usable, ...repoReadmes]) {
    unique.set(item.source.url, item);
  }

  const context = [...unique.values()]
    .map(
      (item) =>
        `SOURCE: ${item.source.title}
URL: ${item.source.url}
CONTENT:
${item.text}`,
    )
    .join('\n\n---\n\n');

  return {
    context: truncate(context, 14000),
    sources: [...unique.values()].map((item) => item.source),
  };
}

function safeHistory(
  history: Array<{ role?: string; content?: string }> | undefined,
) {
  return (history || [])
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string',
    )
    .slice(-4)
    .map((item) => ({
      role: item.role as 'user' | 'assistant',
      content: String(item.content).slice(0, 1600),
    }));
}

function passThroughStream(
  stream: ReadableStream<Uint8Array>,
  sources: Source[],
  model: string,
  webSearch: boolean,
) {
  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'X-Portfolio-Sources': sourceHeader(sources),
      'X-Portfolio-Model': model,
      'X-Portfolio-Web-Search': webSearch ? 'enabled' : 'fallback',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'portfolio-ai',
        model: MODEL,
        fallbackModel: FALLBACK_MODEL,
        inference: 'server-side',
        streaming: false,
        webSearch: false,
        firstPartySources: true,
        generalQuestions: true,
        protocol: 'chat-completions-json',
        webSearchTool: null,
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }

    try {
      let body: {
        question?: unknown;
        evidence?: unknown;
        history?: Array<{ role?: string; content?: string }>;
      };

      try {
        body = (await request.json()) as typeof body;
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const question =
        typeof body.question === 'string' ? body.question.trim() : '';
      const clientEvidence =
        typeof body.evidence === 'string'
          ? body.evidence.slice(0, 8000)
          : '';
      const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (!question || question.length > 2000) {
        return json({ error: 'Invalid question' }, 400);
      }

      const liveGithubQuestion =
        /\b(?:github|repository|repo|source code|codebase|commit|commits|pull request|pull requests)\b/i.test(
          question,
        );

      const firstParty = liveGithubQuestion
        ? await fetchFirstPartyContext(question)
        : {
            context: '',
            sources: [
              {
                url: 'https://checkmyprofolio.github.io/',
                title: 'Vidit Shah — published portfolio',
                kind: 'portfolio' as const,
              },
            ],
          };

      const system = `You are Profolio AI, the friendly professional assistant for Vidit Shah's public portfolio.

IDENTITY
- You are Profolio AI, not Vidit.
- Refer to Vidit as Vidit, he, his, or Vidit's.
- Never pretend to be Vidit and never call Vidit's work "my projects", "my degree", or "my experience".

FACTS AND HONESTY
- Use the published portfolio evidence below for Vidit-specific facts.
- For explicit GitHub, repository, or code questions, also use the live GitHub evidence below.
- Never invent a missing fact, date, personal detail, employer, award, metric, technology, or project detail.
- If the requested information is not present, say so clearly: "I don't have that information in Vidit's published portfolio or GitHub sources, so I don't want to guess."
- Do not replace a missing fact with a different fact. For example, a graduation date is not a birth date.
- Do not claim personal actions such as testing, deploying, benchmarking, searching, or verifying unless the evidence supports that claim.

HUMAN CONVERSATION
- Behave like a socially aware human assistant, not a form or FAQ.
- Match the visitor's intent and tone.
- For greetings, greet naturally and warmly, with a brief line that establishes what Profolio AI is.
- For thanks, acknowledgement, praise, or casual remarks, respond naturally and briefly.
- Understand typos, shorthand, casual phrasing, and incomplete sentences from context.
- For a direct factual question, answer directly first; do not start with a generic introduction.
- For a technical question, explain clearly at the visitor's level and use examples when useful.
- For a question about Vidit, give the relevant facts rather than describing how the assistant works.
- When information is unavailable, politely decline the unsupported part instead of fabricating an answer.

RESPONSE STYLE
- Sound natural, confident, warm, and professional.
- Use Markdown when it improves readability.
- Use a concise H1 for substantial factual answers, not for simple greetings or one-line replies.
- Use H2/H3 sections only when they genuinely help.
- Use bullets or numbered lists for multiple technical points.
- Use 3-6 relevant emojis naturally across substantive answers; headings and major bullet groups should usually include an emoji.
- For simple greetings, use 1-2 emojis.
- For technical answers, use emojis to visually distinguish major ideas without putting one in every sentence.
- Avoid repetitive phrases such as "Here is the answer", "Certainly", or "As an AI".
- Never output JSON.
- Never end with a question, "let me know", or an invitation to continue.
- Keep most answers around 100-240 words; be shorter for casual conversation and longer only when the question needs it.

EXAMPLES
Visitor: "Hi"
Profolio AI: "Hey! 👋 I'm Profolio AI, the assistant for Vidit's public portfolio. I can help with his projects, engineering work, skills, education, and the technical details published here."

Visitor: "Thanks"
Profolio AI: "You're welcome. Glad that helped."

Visitor: "What's Vidit's birth date?"
Profolio AI: "I don't have Vidit's birth date in the published portfolio or GitHub sources, so I don't want to guess."

Visitor: "Tell me about all his projects."
Profolio AI: "## Vidit's Projects 🚀
Vidit has worked across local AI, robotics, software systems, and applied experimentation..." followed by only evidence-supported details.

LIVE GITHUB EVIDENCE:
${firstParty.context}

PUBLISHED PORTFOLIO EVIDENCE:
${clientEvidence}`;

      // Production inference stays on the fast 3B model, but the browser
      // receives one complete response. This avoids choppy token rendering.
      const activeModel = MODEL;
      const webSearch = false;

      let result: unknown;
      try {
        result = await env.AI.run(MODEL, {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: question },
          ],
          stream: false,
          max_tokens: 360,
          temperature: 0.2,
          top_p: 0.9,
          seed: 17,
        });
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Fast 3B inference failed.',
            code: 'FAST_MODEL_FAILED',
          },
          502,
        );
      }

      const responseText = (() => {
        if (typeof result === 'string') return result;
        if (!result || typeof result !== 'object') return '';

        const value = result as Record<string, unknown>;
        if (typeof value.response === 'string') return value.response;
        if (typeof value.answer === 'string') return value.answer;

        const choices = Array.isArray(value.choices) ? value.choices : [];
        const first = choices[0];
        if (first && typeof first === 'object') {
          const choice = first as Record<string, unknown>;
          if (typeof choice.text === 'string') return choice.text;

          const message = choice.message;
          if (message && typeof message === 'object') {
            const content = (message as Record<string, unknown>).content;
            if (typeof content === 'string') return content;
          }
        }

        return '';
      })().trim();

      if (!responseText) {
        return json(
          {
            error: 'Fast 3B inference returned an empty response.',
            code: 'EMPTY_RESPONSE',
          },
          502,
        );
      }

      return json({
        answer: responseText,
        mode: 'model-generated',
        sources: firstParty.sources,
        model: activeModel,
        webSearch,
        streaming: false,
      });
    } catch (error) {
      return json(
        {
          error: error instanceof Error ? error.message : 'Inference failed',
          code: 'INFERENCE_FAILED',
        },
        500,
      );
    }
  },
};
