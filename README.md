# karabuka-core

The AI core of the AZIFLOW site: a small chat page and one API on Cloudflare Workers AI.

- `GET /` the chat page (Arabic RTL, light and dark)
- `POST /api/chat` `{ "message": "...", "history": [...] }` → `{ "reply": "..." }`
- `GET /api/health` → `{ "ok": true }`

Limits: 500 characters per message, 8 past turns, 400 answer tokens, 10 requests per minute per IP. Nothing is stored; visitor text is never logged.

What the assistant knows lives in `src/knowledge.js`. This repo is public: put only public facts there.

## Run

```
npm install
npx wrangler dev
```

Deploys on push to `main` through Cloudflare Workers Builds.

License: MIT.
