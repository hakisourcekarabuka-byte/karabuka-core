import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { sseToText } from "../src/index.js";
import { frameAncestors } from "../src/widget.js";

test("widget.js is served as script, cross-origin loadable, without the model name", async () => {
  const r = await worker.fetch(new Request("https://x/widget.js"), env());
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /^text\/javascript/);
  assert.equal(r.headers.get("cross-origin-resource-policy"), "cross-origin");
  const js = await r.text();
  assert.match(js, /\/embed/);
  assert.match(js, /attachShadow/);
  assert.doesNotMatch(js, /llama/);
  new Function(js); // parses
});

test("/embed is framable only by EMBED_ORIGINS; / stays DENY", async () => {
  const r = await worker.fetch(new Request("https://x/embed"), env({ EMBED_ORIGINS: "https://aziflow.com https://www.aziflow.com" }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-frame-options"), null);
  assert.match(r.headers.get("content-security-policy"), /frame-ancestors https:\/\/aziflow\.com https:\/\/www\.aziflow\.com$/);
  const none = await worker.fetch(new Request("https://x/embed"), env());
  assert.match(none.headers.get("content-security-policy"), /frame-ancestors 'none'$/);
  const home = await worker.fetch(new Request("https://x/"), env({ EMBED_ORIGINS: "https://aziflow.com" }));
  assert.equal(home.headers.get("x-frame-options"), "DENY");
});

test("frameAncestors drops anything that is not a plain https origin", () => {
  assert.equal(frameAncestors(""), "'none'");
  assert.equal(frameAncestors(undefined), "'none'");
  assert.equal(frameAncestors("*"), "'none'");
  assert.equal(frameAncestors("http://aziflow.com https://x.com/path 'self' https://a.b;script-src"), "'none'");
  assert.equal(frameAncestors("https://aziflow.com, https://dev.aziflow.com:8443"), "https://aziflow.com https://dev.aziflow.com:8443");
});

const sse = (parts) => new ReadableStream({
  start(c) { const e = new TextEncoder(); for (const p of parts) c.enqueue(e.encode(p)); c.close(); },
});

function env(over = {}) {
  return {
    MODEL: "m", ASSISTANT_NAME: "Haki",
    LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async (_m, i) => (i.stream ? sse(['data: {"response":"مرح"}\n', 'data: {"respo', 'nse":"با"}\n\ndata: [DONE]\n']) : { response: " hi " }) },
    ...over,
  };
}
const post = (body, e = env()) => worker.fetch(new Request("https://x/api/chat", {
  method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body),
}), e);

test("page is served with a CSP and never embeds the model name", async () => {
  const r = await worker.fetch(new Request("https://x/"), env());
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-security-policy"), /default-src 'none'/);
  const html = await r.text();
  assert.match(html, /dir="rtl"/);
  assert.doesNotMatch(html, /llama/);
});

test("non-stream chat returns a trimmed reply", async () => {
  const r = await post({ message: "hello" });
  assert.deepEqual(await r.json(), { reply: "hi" });
});

test("stream chat joins tokens split across chunks", async () => {
  const r = await post({ message: "hello", stream: true });
  assert.equal(r.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await r.text(), "مرحبا");
});

test("history drops system turns and is capped", async () => {
  let seen;
  const e = env({ AI: { run: async (_m, i) => { seen = i.messages; return { response: "ok" }; } } });
  const history = [{ role: "system", content: "evil" }, ...Array.from({ length: 20 }, (_, n) => ({ role: "user", content: "x".repeat(900) + n }))];
  await post({ message: "q", history }, e);
  assert.equal(seen.filter((m) => m.role === "system").length, 1);
  assert.equal(seen.length, 1 + 8 + 1);
  assert.ok(seen.every((m) => m.role === "system" || m.content.length <= 500));
});

test("input errors and limits", async () => {
  assert.equal((await post({ message: " " })).status, 400);
  assert.equal((await post({ message: "a".repeat(501) })).status, 413);
  assert.equal((await post("{")).status, 400);
  assert.equal((await post({ message: "hi" }, env({ LIMITER: { limit: async () => ({ success: false }) } }))).status, 429);
  assert.equal((await worker.fetch(new Request("https://x/api/chat"), env())).status, 405);
  assert.equal((await worker.fetch(new Request("https://x/nope"), env())).status, 404);
});

test("AI failure is a 503 and logs no visitor text", async () => {
  const logs = [];
  const orig = console.error; console.error = (...a) => logs.push(a.join(" "));
  try {
    const r = await post({ message: "secret-visitor-text" }, env({ AI: { run: async () => { throw new Error("boom"); } } }));
    assert.equal(r.status, 503);
  } finally { console.error = orig; }
  assert.ok(logs.every((l) => !l.includes("secret-visitor-text")));
});

test("sseToText accepts the OpenAI-style delta shape too", async () => {
  const out = await new Response(sse(['data: {"choices":[{"delta":{"content":"a"}}]}\n', "data: [DONE]\n"]).pipeThrough(sseToText())).text();
  assert.equal(out, "a");
});
