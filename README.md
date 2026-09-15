# Profolio

Vidit Shah's public Next.js portfolio. All pages and MeeraAI downloads are accessible without visitor accounts. Legacy login, registration, verification, and profile setup URLs redirect to `/home`. The old profile control now opens a portfolio chat, also accessible at `/profile`.

## Development

Run `npm install`, then `npm run dev` (port 9002). Validate with `npm run typecheck` and `npm run build`.

## Portfolio chat

Without a model configuration, the chat serves clearly labeled answers from `src/lib/data.ts`. It does not pretend to run an AI model. To enable a small language model locally:

1. Install Ollama and run `ollama pull qwen2.5:3b`.
2. Add `PORTFOLIO_MODEL_BASE_URL=http://127.0.0.1:11434/v1` and `PORTFOLIO_MODEL=qwen2.5:3b` to `.env`.
3. Start Ollama and restart Next.js.

For deployment, use an OpenAI-compatible model service reachable from the Next.js server; configure the base URL, model, and optional `PORTFOLIO_MODEL_API_KEY` in the hosting environment. Localhost on Vercel refers to the Vercel server, so a local Ollama installation is only suitable for local development. Keep all credentials server-side. See `.env.example`.

The server uses the portfolio biography, skills, project descriptions, and build notes as context. When model inference is enabled, it additionally reads public profile and repository metadata for `viditshah5656` from GitHub, cached for ten minutes. Optional `PORTFOLIO_GITHUB_TOKEN` increases GitHub API limits. No visitor profile, email, phone, or chat history is persisted. The model provider receives the submitted conversation and public context.

GitHub Models inference was retired July 30, 2026: https://docs.github.com/en/github-models . GitHub remains the public project data source; inference requires a separate model server.

Requests have input limits, a 30-second inference timeout, and a basic per-instance rate limiter (12 requests/minute/IP). For high-traffic deployments, enforce shared rate limits at the hosting edge. Provider failures fall back to labeled portfolio answers. Update portfolio data to keep answers current; repository metadata does not include source code or full README content.

## Contact form

The public contact page submits name, email, and message to the existing Formspree form `mgvnadyy`. Set `NEXT_PUBLIC_CONTACT_FORM_ID` to change the recipient form. Formspree must have an active form and verified recipient. Success is shown only after Formspree confirms submission; errors allow retry and provide an email alternative.

## Engineering profile and evidence

`src/lib/engineering-profile.ts` is the shared source for the September 2026 biography, education, coursework, capability map, project descriptions, skills, and engineering method supplied by Vidit. `/dashboard` presents the animated personal engineering overview; detailed project records live in the Projects page popup; shared project cards, biography, and chat consume the same source. The dashboard focuses on education, coursework, domains, skills, engineering method, and future direction, with no repository statistics or project inventory. Project briefs are not public-source certification. Public visibility was checked without credentials on 2026-09-15. No private code or private repository totals are exposed.

## Resume and certificates

Documents from the root `Resume` and `Certificates` folders are published under `public/documents`, indexed in `src/lib/portfolio-documents.ts`. The dashboard opens them in a glass document dialog, with rendered single-page previews for browser/mobile compatibility, optional native PDF viewing, original-file downloads, and open-in-new-tab controls. Source documents are preserved unchanged. Add or replace a document by copying its file, rendering an updated preview, and updating the manifest.
