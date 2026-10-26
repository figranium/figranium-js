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


describe("v0.21 Baserow Task output compatibility", () => {
  it("preserves database and dedicated-table fields when saving a Task", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => json({ id: "task_1" }));
    const client = new Figranium({ apiKey: "test", fetch: fetcher });
    const task: Task = {
      name: "Baserow output", url: "https://example.com", mode: "agent",
      output: { provider: "baserow", credentialId: "credential_1", databaseId: "12", tableId: "34", dedicated: true, onError: "fail" },
    };
    await client.tasks.save(task);
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)).output).toEqual(task.output);
  });
});

describe("retired AI Task endpoints", () => {
  it("does not expose methods that call non-existent server routes", () => {
    const client = new Figranium({ apiKey: "test" });
    expect("generateSelector" in client.tasks).toBe(false);
    expect("generateScript" in client.tasks).toBe(false);
  });
});

describe("Task PATCH response compatibility", () => {
  it("exposes the server's ISO updatedAt timestamp as a string", async () => {
    const updatedAt = "2026-10-25T12:00:00.000Z";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({
      id: "task_1", updatedAt, status: "success", task: { id: "task_1", name: "Updated" },
    }));
    const client = new Figranium({ apiKey: "test", fetch: fetcher });
    const response = await client.tasks.update("task_1", { name: "Updated" });
    const timestamp: string = response.updatedAt;
    expect(timestamp).toBe(updatedAt);
  });
});

describe("cookie-state timestamp compatibility", () => {
  it("types createdAt and updatedAt as server ISO strings", async () => {
    const createdAt = "2026-10-24T12:00:00.000Z";
    const updatedAt = "2026-10-25T12:00:00.000Z";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ id: "cookies_1", name: "Login", createdAt, updatedAt }));
    const client = new Figranium({ session: true, fetch: fetcher });
    const state = await client.cookieStates.get("cookies_1");
    const created: string | undefined = state.createdAt;
    const updated: string | undefined = state.updatedAt;
    expect([created, updated]).toEqual([createdAt, updatedAt]);
  });
});


describe("Cabinet response contracts", () => {
  it("returns the default Cabinet ID and catalog when listing", async () => {
    const catalog = { defaultCabinetId: "cab_default", cabinets: [{ id: "cab_default", name: "Basic", unuploadedCount: 2 }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(catalog));
    const client = new Figranium({ apiKey: "test", fetch: fetcher });
    const response: { defaultCabinetId: string; cabinets: import("../src").Cabinet[] } = await client.cabinets.list();
    expect(response).toEqual(catalog);
    const pending: number | undefined = response.cabinets[0]?.unuploadedCount;
    expect(pending).toBe(2);
    expect(fetcher.mock.calls[0]?.[0]).toBe("http://localhost:11345/api/cabinets");
  });

  it("returns the updated catalog after deleting a Cabinet", async () => {
    const catalog = { defaultCabinetId: "cab_default", cabinets: [{ id: "cab_default", name: "Basic" }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(catalog));
    const client = new Figranium({ session: true, fetch: fetcher });
    const response: { defaultCabinetId: string; cabinets: import("../src").Cabinet[] } =
      await client.cabinets.delete("cab/old", { targetCabinetId: "cab_default", migrate: true });
    expect(response).toEqual(catalog);
    expect(fetcher.mock.calls[0]?.[0]).toBe("http://localhost:11345/api/cabinets/cab%2Fold");
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      targetCabinetId: "cab_default", mode: "migrate",
    });
  });

  it("returns the extracted folder item rather than an items wrapper", async () => {
    const folder = { id: "item_2", name: "archive", kind: "folder", status: "unuploaded" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(folder));
    const client = new Figranium({ session: true, fetch: fetcher });
    const response: import("../src").CabinetItem = await client.cabinets.unzipItem("cab_1", "item_1");
    expect(response).toEqual(folder);
    expect(fetcher.mock.calls[0]?.[0]).toBe("http://localhost:11345/api/cabinets/cab_1/items/item_1/unzip");
  });
});


describe("selector variable compatibility", () => {
  it("accepts the selector variable type used by the core Task API", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ id: "task_selector" }));
    const client = new Figranium({ apiKey: "test", fetch: fetcher });
    const task: Task = {
      name: "Selector variable", url: "https://example.com", mode: "agent",
      variables: { target: { type: "selector", value: ".submit" } },
      actions: [{ type: "if", conditionVar: "target", conditionVarType: "selector", conditionOp: "exists" }],
    };
    await client.tasks.save(task);
    const sent = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(sent.variables.target).toEqual({ type: "selector", value: ".submit" });
    expect(sent.actions[0].conditionVarType).toBe("selector");
  });
});
