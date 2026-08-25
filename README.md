# @figranium/sdk

[![npm version](https://img.shields.io/npm/v/%40figranium%2Fsdk.svg)](https://www.npmjs.com/package/@figranium/sdk)

Official TypeScript and JavaScript SDK for [Figranium](https://github.com/figranium/figranium), the self-hosted browser automation and web scraping platform.

- TypeScript-first, with complete declaration files
- Works in Node.js 18+ and modern browsers
- ESM and CommonJS builds
- No runtime dependencies
- API-key and browser-session authentication
- Abortable requests, configurable timeouts, structured errors, and SSE streams

## Install

```bash
npm install @figranium/sdk
```

## Quick start

```ts
import { Figranium } from "@figranium/sdk";

const figranium = new Figranium({
  baseUrl: "http://localhost:11345",
  apiKey: process.env.FIGRANIUM_API_KEY!,
});

const { tasks } = await figranium.tasks.listSummaries();
const result = await figranium.runTask(tasks[0].id, {
  variables: { query: "TypeScript SDK" },
});

console.log(result.data);
```

The same API works from CommonJS:

```js
const { Figranium } = require("@figranium/sdk");

const figranium = new Figranium({ apiKey: process.env.FIGRANIUM_API_KEY });
```

`baseUrl` defaults to `http://localhost:11345`. API keys use `Authorization: Bearer` by default, as recommended by Figranium. Set `apiKeyHeader: "x-api-key"` if your deployment expects that header.

## Create a typed task

```ts
import { actions, Figranium, variable, type Task } from "@figranium/sdk";

const figranium = new Figranium({ apiKey: process.env.FIGRANIUM_API_KEY! });

const task: Task = {
  name: "Search and extract",
  description: "Runs a search and captures visible results",
  url: "https://example.com",
  mode: "agent",
  variables: {
    query: { type: "string", value: "figranium" },
  },
  actions: [
    actions.waitFor("#search"),
    actions.type("#search", variable("query")),
    actions.press("Enter", "#search"),
    actions.waitFor(".results"),
    actions.getContent(".results", "resultText"),
  ],
};

const saved = await figranium.tasks.save(task);
const result = await figranium.runTask(saved.id!, {
  variables: { query: "browser automation" },
});
```

`variable("query")` produces Figranium’s required `{$query}` syntax. The action helpers generate stable unique action IDs. You can also pass plain typed action objects when you need every field exposed by the task specification.

CAPTCHA-aware tasks can wait for an interactable challenge without clicking it, then solve it in a separate action:

```ts
actions.waitForCaptcha({
  captchaType: "turnstile",
  selector: "#challenge",
  timeout: 120_000,
  varName: "captchaReady",
});

actions.solveCaptcha({ captchaType: "turnstile", timeout: 120_000 });
```

`waitForCaptcha()` only waits for the checkbox or equivalent provider control to become ready. Its result is available through `block.output` and, when supplied, `varName`.

## Stream executions

```ts
const controller = new AbortController();

for await (const event of figranium.executions.stream({
  signal: controller.signal,
})) {
  console.log(event.event, event.data);
}
```

Streams implement `AsyncIterable` and are disconnected when iteration ends or the signal is aborted. Set `timeoutMs` on a stream only when you want a terminal stream deadline; streams otherwise remain open.

## Error handling

```ts
import { FigraniumError } from "@figranium/sdk";

try {
  await figranium.runTask("missing-task");
} catch (error) {
  if (error instanceof FigraniumError) {
    console.error(error.status);     // HTTP status, or 0 for transport failures
    console.error(error.code);       // e.g. TASK_NOT_FOUND
    console.error(error.details);    // server-provided diagnostics
    console.error(error.requestId);  // when supplied by the server/proxy
  }
}
```

Every request accepts `{ signal, timeoutMs, headers }` as its final argument. The client-wide timeout defaults to 30 seconds.

## Client resources

The `Figranium` instance exposes:

| Resource | Purpose |
|---|---|
| `tasks` | Save, update, delete, version, generate, and execute tasks |
| `executions` | List, inspect, stop, delete, clear, and stream runs |
| `schedules` | Configure, describe, disable, and inspect schedules |
| `captures` | List/delete recordings and screenshots; manage cookies |
| `credentials` | Manage output credentials and browse Baserow metadata |
| `browser` | Open browser sessions, highlight selectors, inspect headful sessions, and stream selector events |
| `execution` | Direct `scrape`, `agent`, and `headful` execution endpoints |
| `settings` | Session-protected API keys, AI providers/models, theme, user agent, and proxy configuration |
| `auth` | Initial setup and session login/logout/current-user methods |
| `health` | Service health check |

Convenience aliases are available at `figranium.runTask()`, `figranium.scrape()`, `figranium.agent()`, and `figranium.headful()`.

See [docs/API.md](docs/API.md) for the method index and [examples/basic.ts](examples/basic.ts) for a complete example.

## Session-only administration

Figranium’s `/api/settings/*` endpoints require an authenticated user session rather than an API key. In a browser, construct the client with `{ session: true }` so cookies are included. Node’s built-in `fetch` does not keep a cookie jar; for Node-based administration, supply a cookie-aware `fetch` implementation through the `fetch` option.

```ts
const admin = new Figranium({
  baseUrl: "https://figranium.example",
  session: true,
});
```

## Custom fetch

Proxies, tracing, test doubles, and cookie jars can be integrated without adapters:

```ts
const figranium = new Figranium({
  apiKey: "...",
  fetch: instrumentedFetch,
  headers: { "x-client-name": "my-service" },
});
```

## Compatibility

This release is modeled against Figranium API `0.14.4` and the accompanying `AGENT_SPEC.md`. Unknown fields are preserved through flexible task and result types so newer servers can add response data without breaking SDK consumers.

## License

Apache-2.0
