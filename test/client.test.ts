import { describe, expect, it, vi } from "vitest";
import { actions, Figranium, FigraniumError, variable } from "../src";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });

describe("Figranium client", () => {
  it("normalizes URLs and sends Bearer authentication by default", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ tasks: [] }));
    const client = new Figranium({ baseUrl: "https://figranium.example///", apiKey: "secret", fetch: fetcher });

    await client.tasks.listSummaries();

    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://figranium.example/api/tasks/list");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer secret");
  });

  it("supports x-api-key authentication", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ status: "ok" }));
    const client = new Figranium({ apiKey: "secret", apiKeyHeader: "x-api-key", fetch: fetcher });

    await client.health.check();

    expect(new Headers(fetcher.mock.calls[0]![1]?.headers).get("x-api-key")).toBe("secret");
  });

  it("serializes execution inputs and safely encodes path parameters", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ success: true, outcome: "anti_bot", data: [1] }));
    const client = new Figranium({ apiKey: "secret", fetch: fetcher });

    const result = await client.runTask<number[]>("task/a", { variables: { query: "books" }, runId: "run-1" });

    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("http://localhost:11345/tasks/task%2Fa/api");
    expect(JSON.parse(String(init?.body))).toEqual({ variables: { query: "books" }, runId: "run-1" });
    expect(result.data).toEqual([1]);
    expect(result.outcome).toBe("anti_bot");
  });

  it("preserves server diagnostics in FigraniumError", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(
      { error: "TASK_NOT_FOUND", message: "No such task", details: { id: "x" } },
      { status: 404, headers: { "x-request-id": "req-1" } },
    ));
    const client = new Figranium({ apiKey: "secret", fetch: fetcher });

    const error = await client.runTask("x").catch((value: unknown) => value);

    expect(error).toBeInstanceOf(FigraniumError);
    expect(error).toMatchObject({ status: 404, code: "TASK_NOT_FOUND", requestId: "req-1", details: { id: "x" } });
  });

  it("aborts requests at the configured timeout", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    }));
    const client = new Figranium({ apiKey: "secret", timeoutMs: 5, fetch: fetcher });

    const error = await client.health.check().catch((value: unknown) => value);

    expect(error).toBeInstanceOf(FigraniumError);
    expect(error).toMatchObject({ code: "REQUEST_ABORTED" });
  });

  it("parses JSON SSE events, multiline text, and metadata", async () => {
    const body = [
      "id: one\nevent: execution\ndata: {\"status\":\"running\"}\n\n",
      "data: hello\ndata: world\nretry: 2500\n\n",
    ].join("");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, {
      headers: { "content-type": "text/event-stream" },
    }));
    const client = new Figranium({ apiKey: "secret", fetch: fetcher });

    const events = [];
    for await (const event of client.executions.stream()) events.push(event);

    expect(events).toEqual([
      { data: { status: "running" }, raw: "{\"status\":\"running\"}", event: "execution", id: "one" },
      { data: "hello\nworld", raw: "hello\nworld", retry: 2500 },
    ]);
  });

  it("cancels the response body when stream iteration stops early", async () => {
    const cancelled = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("data: one\n\n"));
      },
      cancel: cancelled,
    });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, {
      headers: { "content-type": "text/event-stream" },
    }));
    const client = new Figranium({ apiKey: "secret", fetch: fetcher });

    for await (const _event of client.executions.stream()) break;

    expect(cancelled).toHaveBeenCalledOnce();
  });

  it("routes representative resource calls to the documented endpoints", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ success: true }));
    const client = new Figranium({ apiKey: "secret", fetch: fetcher });

    await client.tasks.update("task 1", { name: "Updated" });
    await client.executions.stop({ runId: "run-1" });
    await client.schedules.delete("task 1");
    await client.captures.delete("recording.webm");
    await client.credentials.baserowTables("cred/1", 42);
    await client.browser.inspect();

    expect(fetcher.mock.calls.map(([url, init]) => [init?.method, url])).toEqual([
      ["PATCH", "http://localhost:11345/api/tasks/task%201"],
      ["POST", "http://localhost:11345/api/executions/stop"],
      ["DELETE", "http://localhost:11345/api/schedules/task%201"],
      ["DELETE", "http://localhost:11345/api/data/captures/recording.webm"],
      ["GET", "http://localhost:11345/api/credentials/cred%2F1/proxy/baserow/databases/42/tables"],
      ["POST", "http://localhost:11345/api/headful/inspect"],
    ]);
  });
});

describe("action helpers", () => {
  it("creates spec-compliant action IDs and variable templates", () => {
    const step = actions.type("#query", variable("search.query"));
    expect(step).toMatchObject({ type: "type", selector: "#query", value: "{$search.query}", typeMode: "replace" });
    expect(step.id).toMatch(/^act_type_/);
  });

  it("keeps caller-supplied IDs", () => {
    expect(actions.click("#submit", { id: "submit" }).id).toBe("submit");
  });

  it("creates a typed wait_captcha readiness action", () => {
    expect(actions.waitForCaptcha({
      captchaType: "turnstile",
      selector: "#challenge",
      timeout: 120_000,
      varName: "captchaReady",
    }, { id: "wait-captcha" })).toEqual({
      id: "wait-captcha",
      type: "wait_captcha",
      captchaType: "turnstile",
      selector: "#challenge",
      timeout: 120_000,
      varName: "captchaReady",
    });
    expect(actions.waitForCaptcha().type).toBe("wait_captcha");
  });
});
