# Portfolio AI backend

This runs the portfolio LLM on Cloudflare Workers AI infrastructure. The visitor browser never downloads the model and performs no inference.

Deployment requires a Cloudflare account with Workers AI enabled and:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

Deploy:
npx wrangler deploy --config worker/wrangler.toml
