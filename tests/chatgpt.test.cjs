require("./load-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { requireLocalChatGPT } = require("../src/lib/coach/chatgpt-policy.ts");
const { POST: analyze } = require("../src/app/api/coach/analyze/route.ts");
const { POST: speech } = require("../src/app/api/coach/speech/route.ts");
const { text, rawNaturalLesson } = require("./natural-reading.cjs");

const request = (path) => new Request(`http://localhost/api/coach/${path}`, {
  method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ text }),
});
async function planTest(fn) {
  const previous = process.env.CHATGPT_PLAN_ENABLED;
  const previousKey = process.env.OPENAI_API_KEY;
  const previousRuntime = global.englistChatGPT;
  process.env.CHATGPT_PLAN_ENABLED = "1";
  process.env.OPENAI_API_KEY = "test-unused-platform-key";
  try { await fn(); }
  finally {
    if (previous === undefined) delete process.env.CHATGPT_PLAN_ENABLED; else process.env.CHATGPT_PLAN_ENABLED = previous;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    global.englistChatGPT = previousRuntime;
  }
}

test("personal-plan endpoints require loopback and reject foreign browser origins", async () => planTest(() => {
  assert.doesNotThrow(() => requireLocalChatGPT(request("chatgpt")));
  for (const bad of [
    new Request("https://example.com/api/coach/chatgpt"),
    new Request("http://localhost/api/coach/chatgpt", { headers: { origin: "https://evil.example" } }),
    new Request("http://localhost/api/coach/chatgpt", { headers: { "sec-fetch-site": "cross-site" } }),
    new Request("http://localhost/api/coach/chatgpt", { headers: { host: "localhost.evil.example" } }),
  ]) assert.throws(() => requireLocalChatGPT(bad), (error) => error.status === 403);
}));

test("plan analysis uses a discovered model, validates sounds and never calls Platform billing", async () => planTest(async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error("Unexpected billed API request"); };
    global.englistChatGPT = { client: {
      getSession: async () => ({ status: "connected", sharing: true }),
      listModels: async () => [{ slug: "account-available-model", displayName: "Account model" }],
      streamResponse: async (options) => {
        assert.equal(options.model, "account-available-model");
        assert.match(options.instructions, /featureIds/);
        assert.equal(JSON.parse(options.input)[0].text, text);
        return { text: JSON.stringify(rawNaturalLesson()) };
      },
    } };
    const result = await analyze(request("analyze"));
    assert.equal(result.status, 200);
    const lesson = await result.json();
    assert.equal(lesson.sentences[0].words[4].sounds[1].omitted, true);
    assert.equal(global.englistChatGPT.model, "Account model");
    global.englistChatGPT.client.streamResponse = async () => ({ text: '{"sentences":[]}' });
    assert.equal((await analyze(request("analyze"))).status, 502);
  } finally { global.fetch = originalFetch; }
}));

test("missing plan consent stops before inference even when an API key exists", async () => planTest(async () => {
  for (const session of [{ status: "disconnected", sharing: false }, { status: "connected", sharing: false }]) {
    global.englistChatGPT = { client: {
      getSession: async () => session,
      listModels: async () => { throw new Error("Must not request models before consent"); },
    } };
    const response = await analyze(request("analyze"));
    assert.equal(response.status, session.status === "disconnected" ? 401 : 403);
  }
  const response = await speech(request("speech"));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /未启用另行计费/);
}));
