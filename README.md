# karabuka-core

The AI core of the AZIFLOW site: a small chat page and one API on Cloudflare Workers AI.

- `GET /` the chat page (Arabic RTL, light and dark)
- `POST /api/chat` `{ "message": "...", "history": [...] }` → `{ "reply": "..." }`
- `GET /api/health` → `{ "ok": true }`

Limits: 500 characters per message, 8 past turns, 400 answer tokens, 10 requests per minute per IP. Visitor text is never logged.

Memory: with the `MEMORY` KV binding, the chat remembers one visitor's last 8 turns for 24 hours, keyed by a random id the page keeps in the browser (no IP, no cookie). "محادثة جديدة" deletes it at once. Without the binding nothing is stored.
- `POST /api/history` `{ "sid": "..." }` → `{ "history": [...] }`; with `"forget": true` it deletes them.

Site widget: `<script src="https://<worker>/widget.js" defer></script>` adds a floating chat button; `/embed` may be framed only by the origins in `EMBED_ORIGINS`.

What the assistant knows lives in `src/knowledge.js`. This repo is public: put only public facts there.

## Run

```
npm install
npx wrangler dev
```

Deploys on push to `main` through Cloudflare Workers Builds.

License: MIT.
