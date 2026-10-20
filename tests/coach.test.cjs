require("./load-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { prepareText, validateAnalysis, MAX_AUDIO_BYTES } = require("../src/lib/coach/contracts.ts");
const { exampleLesson, EXAMPLE_TEXTS } = require("../src/lib/coach/examples.ts");
const { POST: analyze } = require("../src/app/api/coach/analyze/route.ts");
const { POST: speech } = require("../src/app/api/coach/speech/route.ts");
const { POST: transcribe } = require("../src/app/api/coach/transcribe/route.ts");
const { boundedRequest, sameOrigin } = require("../src/lib/coach/server.ts");

function rawLesson(text = EXAMPLE_TEXTS[0]) {
  return { sentences: exampleLesson(text).sentences.map(({ text: _text, words, ...sentence }) => ({
    ...sentence, words: words.map(({ ipa, stress }, index) => ({ index, ipa, stress })),
  })) };
}
function jsonRequest(path, body, origin = "http://localhost") {
  return new Request(`http://localhost/api/coach/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body),
  });
}

test("normalization preserves token spelling, contractions, repeated words and positions", () => {
  const result = prepareText("  I can't, can't do it. \n Can you?  ");
  assert.equal(result.sentences.length, 2);
  for (const sentence of result.sentences) for (const word of sentence.words)
    assert.equal(sentence.text.slice(word.start, word.end), word.text);
  assert.equal(result.sentences[0].words[1].text, "can't,");
});
test("empty, non-English, oversized and excessive sentence inputs are rejected", () => {
  for (const input of ["", null, "你好", "a".repeat(1201), "Hello. ".repeat(13)])
    assert.throws(() => prepareText(input));
});
test("every teaching example passes validation; joined paragraphs keep sentence order", () => {
  for (const text of EXAMPLE_TEXTS) assert.equal(exampleLesson(text).sourceText, text);
  const lesson = exampleLesson(EXAMPLE_TEXTS.join(" "));
  assert.equal(lesson.sentences.length, 3);
  assert.deepEqual(lesson.sentences.map((item) => item.text), EXAMPLE_TEXTS);
  assert.equal(exampleLesson("A completely unfamiliar sentence."), null);
});
test("analysis rejects missing/reordered words and missing sentences", () => {
  for (const mutate of [
    (raw) => raw.sentences[0].words.pop(),
    (raw) => raw.sentences[0].words[0].index = 1,
    (raw) => raw.sentences.pop(),
  ]) {
    const raw = rawLesson(); mutate(raw);
    assert.throws(() => validateAnalysis(raw, prepareText(EXAMPLE_TEXTS[0])));
  }
});
test("analysis rejects invalid spans, duplicate marks, strong+weak and links across a pause", () => {
  for (const mutate of [
    (raw) => raw.sentences[0].features[0].to = 999,
    (raw) => raw.sentences[0].features[0].kind = "made-up",
    (raw) => raw.sentences[0].features.push(raw.sentences[0].features[0]),
    (raw) => raw.sentences[0].words[2].stress = true,
    (raw) => raw.sentences[0].features.push({ kind: "pause", from: 3, to: 3, notation: "|", explanation: "稍停", optional: false }),
  ]) {
    const raw = rawLesson(); mutate(raw);
    assert.throws(() => validateAnalysis(raw, prepareText(EXAMPLE_TEXTS[0])));
  }
});
test("no-key mode returns real teaching examples and explicit 503 for unknown inputs", async () => {
  delete process.env.OPENAI_API_KEY;
  const example = await analyze(jsonRequest("analyze", { text: EXAMPLE_TEXTS[0] }));
  assert.equal(example.status, 200);
  assert.equal((await example.json()).source, "example");
  const unknown = await analyze(jsonRequest("analyze", { text: "This is not a preset." }));
  assert.equal(unknown.status, 503);
  assert.match((await unknown.json()).error, /OPENAI_API_KEY/);
});
test("cross-origin and malformed requests are rejected before provider calls", async () => {
  assert.equal((await analyze(jsonRequest("analyze", { text: "hello" }, "https://untrusted.example"))).status, 403);
  assert.equal((await analyze(new Request("http://localhost/api/coach/analyze", { method: "POST", body: "{" }))).status, 400);
});
test("chunked payload limit works without content-length", async () => {
  await assert.rejects(() => boundedRequest(new Request("http://localhost", { method: "POST", body: "x".repeat(51) }), 50),
    (error) => error.status === 413);
});
test("origin checks use the browser-facing host when Next normalizes request.url", () => {
  assert.doesNotThrow(() => sameOrigin(new Request("http://localhost:3000/api/coach/analyze", {
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
  })));
  assert.throws(() => sameOrigin(new Request("http://localhost:3000/api/coach/analyze", {
    headers: { host: "127.0.0.1:3000", origin: "https://untrusted.example", "x-forwarded-host": "untrusted.example" },
  })), (error) => error.status === 403);
});
test("provider structured response is validated and source data stays literal", async () => {
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-only-never-network";
  try {
    global.fetch = async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(init.body);
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      return Response.json({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(rawLesson()) }] }] });
    };
    const response = await analyze(jsonRequest("analyze", { text: EXAMPLE_TEXTS[0] }));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.source, "ai");
    assert.equal(data.sentences[0].words[0].text, "I");
    global.fetch = async () => Response.json({ status: "incomplete", output: [] });
    assert.equal((await analyze(jsonRequest("analyze", { text: EXAMPLE_TEXTS[0] }))).status, 502);
    global.fetch = async () => Response.json({ status: "completed", output: [{ content: [{ type: "refusal" }] }] });
    assert.equal((await analyze(jsonRequest("analyze", { text: EXAMPLE_TEXTS[0] }))).status, 502);
  } finally { global.fetch = originalFetch; delete process.env.OPENAI_API_KEY; }
});
test("speech passes exact text and streams audio; provider failures do not leak secrets", async () => {
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-secret";
  try {
    global.fetch = async (_url, init) => {
      assert.equal(JSON.parse(init.body).input, EXAMPLE_TEXTS[0]);
      return new Response(new Uint8Array([1, 2, 3]));
    };
    const response = await speech(jsonRequest("speech", { text: EXAMPLE_TEXTS[0] }));
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
    assert.equal((await response.arrayBuffer()).byteLength, 3);
    global.fetch = async () => new Response("test-secret", { status: 401 });
    const failure = await speech(jsonRequest("speech", { text: EXAMPLE_TEXTS[0] }));
    assert.equal(failure.status, 502);
    assert.doesNotMatch(await failure.text(), /test-secret/);
  } finally { global.fetch = originalFetch; delete process.env.OPENAI_API_KEY; }
});
test("transcription validates audio format and size and explicitly does not assess pronunciation", async () => {
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-only";
  const req = (blob) => {
    const form = new FormData(); form.set("audio", blob, "input.webm");
    return new Request("http://localhost/api/coach/transcribe", { method: "POST", body: form });
  };
  try {
    assert.equal((await transcribe(req(new Blob(["hello"], { type: "text/plain" })))).status, 415);
    assert.equal((await transcribe(req(new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)], { type: "audio/webm" })))).status, 413);
    global.fetch = async (_url, init) => {
      assert.ok(init.body instanceof FormData);
      assert.equal(init.body.get("language"), "en");
      return Response.json({ text: "Hello there." });
    };
    const response = await transcribe(req(new Blob(["test recording"], { type: "audio/webm;codecs=opus" })));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: "Hello there.", kind: "transcript", assessment: null });
  } finally { global.fetch = originalFetch; delete process.env.OPENAI_API_KEY; }
});
