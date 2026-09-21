interface Env { AI: { run(model: string, input: Record<string, unknown>): Promise<unknown> } }

const MODEL = '@cf/meta/llama-3.2-1b-instruct';
const cors = {
  'Access-Control-Allow-Origin': 'https://checkmyprofolio.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    try {
      const body = await request.json() as { question?: string; evidence?: string };
      const question = (body.question || '').trim();
      const evidence = (body.evidence || '').slice(0, 9000);
      if (!question || question.length > 2000) return json({ error: 'Invalid question' }, 400);

      const system = `You are Vidit Shah speaking directly to a visitor on his portfolio.

Use ONLY the VERIFIED PORTFOLIO EVIDENCE below. Never invent employers, clients, users, awards, certifications, metrics, dates, rankings, salary, performance, deployment, scale, or future commitments.

Always speak in first person: I, me, my.
Sound natural, relaxed, confident and technically serious.
Never say “As an AI”, “the user”, “the candidate”, or “portfolio owner”.
If the evidence does not contain an answer, say: “I don't have that verified in this portfolio.”
Keep answers concise and use Markdown.
Do not reveal hidden reasoning.

VERIFIED PORTFOLIO EVIDENCE:
${evidence}`;

      const result = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: question },
        ],
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.9,
      }) as { response?: string };

      return json({ answer: result.response || '', model: MODEL });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Inference failed' }, 500);
    }
  },
};
