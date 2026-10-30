import { afterEach, describe, expect, it } from "vitest";
import { createServer, type RequestListener, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Figranium } from "../src";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    }),
  ));
});

async function serve(handler: RequestListener): Promise<string> {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe("authenticated redirect safety", () => {
  it("does not forward x-api-key to a cross-origin redirect target", async () => {
    let leaked = false;
    let originalHeader: string | undefined;
    const destination = await serve((_req, response) => {
      leaked = true;
      response.writeHead(200, { "content-type": "application/json" });
      response.end('{"status":"ok"}');
    });
    const source = await serve((request, response) => {
      originalHeader = request.headers["x-api-key"] as string | undefined;
      response.writeHead(302, { location: `${destination}/capture` });
      response.end();
    });

    const client = new Figranium({ baseUrl: source, apiKey: "test-secret", apiKeyHeader: "x-api-key" });
    await expect(client.health.check()).rejects.toMatchObject({
      code: "REDIRECT_NOT_ALLOWED",
      status: 302,
    });
    expect(originalHeader).toBe("test-secret");
    expect(leaked).toBe(false);
  });

  it("rejects SSE redirects before opening a stream on another origin", async () => {
    let leaked = false;
    let originalHeader: string | undefined;
    const destination = await serve((_req, response) => {
      leaked = true;
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.end("data: leaked\\n\\n");
    });
    const source = await serve((request, response) => {
      originalHeader = request.headers["x-api-key"] as string | undefined;
      response.writeHead(307, { location: `${destination}/stream` });
      response.end();
    });

    const client = new Figranium({ baseUrl: source, apiKey: "test-secret", apiKeyHeader: "x-api-key" });
    await expect((async () => {
      for await (const _event of client.executions.stream("run-1")) {
        // A redirected stream must never yield events.
      }
    })()).rejects.toMatchObject({
      code: "REDIRECT_NOT_ALLOWED",
      status: 307,
    });
    expect(originalHeader).toBe("test-secret");
    expect(leaked).toBe(false);
  });
});
