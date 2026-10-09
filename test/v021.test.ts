import { describe, expect, it, vi } from "vitest";
import { Figranium } from "../src";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

describe("v0.21 session-only resources", () => {
  it("lists and creates scoped keys with permissions and task allowlists", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ keys: [], permissions: [] }));
    const client = new Figranium({ session: true, fetch: fetcher });
    await client.apiKeys.list();
    await client.apiKeys.create({ name: "CI", permissions: ["tasks:run"], taskIds: ["a"] });
    expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method, init?.credentials])).toEqual([
      ["http://localhost:11345/api/api-keys", "GET", "include"],
      ["http://localhost:11345/api/api-keys", "POST", "include"],
    ]);
    expect(JSON.parse(String(fetcher.mock.calls[1]![1]?.body))).toEqual({
      name: "CI", permissions: ["tasks:run"], taskIds: ["a"],
    });
  });

  it("encodes cookie state IDs and serializes storage state", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ ok: true }));
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
