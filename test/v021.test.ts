import { describe, expect, it, vi } from "vitest";
import { Figranium, type Task } from "../src";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

describe("v0.21 session-only resources", () => {
  it("encodes cookie state IDs and serializes storage state", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ ok: true }));
    const client = new Figranium({ session: true, fetch: fetcher });
    await client.cookieStates.create({ name: "login", state: { cookies: [], origins: [] } });
    await client.cookieStates.rename("id/1", "new");
    await client.cookieStates.delete("id/1");
    expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ["http://localhost:11345/api/cookie-states", "POST"],
      ["http://localhost:11345/api/cookie-states/id%2F1", "PATCH"],
      ["http://localhost:11345/api/cookie-states/id%2F1", "DELETE"],
    ]);
  });
});


describe("v0.21 Task cookie-state compatibility", () => {
  it("serializes a named state and a fresh-state override", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ id: "task_1" }));
    const client = new Figranium({ apiKey: "test", fetch: fetcher });
    const task: Task = { name: "Stateful", url: "https://example.com", mode: "agent", cookieStateId: "state_login" };
    await client.tasks.save(task);
    await client.tasks.update("task_1", { cookieStateId: null });
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)).cookieStateId).toBe("state_login");
    expect(JSON.parse(String(fetcher.mock.calls[1]?.[1]?.body)).cookieStateId).toBeNull();
  });
});
