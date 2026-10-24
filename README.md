<div align="center">
  <img src="https://raw.githubusercontent.com/figranium/figranium-js/main/banner.png" alt="Figranium Banner">

  <h1>Figranium JavaScript SDK</h1>

  <a href="https://www.npmjs.com/package/@figranium/sdk" target="_blank"><img src="https://img.shields.io/npm/v/%40figranium%2Fsdk.svg?style=for-the-badge&label=NPM&logo=npm&logoColor=white" alt="npm version"></a>

  <p><strong>Official TypeScript and JavaScript SDK for Figranium, the self-hosted browser automation and web scraping platform.</strong></p>

  <p><a href="https://figranium.dev/docs/sdk/js" target="_blank"><strong>Documentation</strong></a></p>
</div>

- TypeScript-first, with complete declaration files
- Works in Node.js 18+ and modern browsers
- ESM and CommonJS builds
- No runtime dependencies
- API-key authentication for automation APIs
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
console.log(result.outcome); // success | error | stopped | crashed | anti_bot
```

The same API works from CommonJS:

```js
const { Figranium } = require("@figranium/sdk");

const figranium = new Figranium({ apiKey: process.env.FIGRANIUM_API_KEY });
```

`baseUrl` defaults to `http://localhost:11345`. API keys use `Authorization: Bearer` by default, as recommended by Figranium. Set `apiKeyHeader: "x-api-key"` if your deployment expects that header.

## CI and command line

The package includes a zero-runtime-dependency CLI for running saved Tasks from CI:

```bash
FIGRANIUM_URL=https://figranium.example \
FIGRANIUM_API_KEY="$FIGRANIUM_API_KEY" \
npx @figranium/sdk run task-id \
  --var baseUrl=https://preview.example.com
```

Use `--json` to emit the complete execution result, `--timeout <ms>` to set a deadline, and repeat `--var name=value` for runtime variables. `--url` and `--api-key` can override the environment variables.

The command exits with `0` when the Task succeeds, `1` when the Task completes unsuccessfully, and `2` for CLI, authentication, network, or configuration failures. This makes the command usable directly as a GitHub Actions, GitLab CI, Jenkins, or other CI step.

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

For Figranium v0.21+, set `cookieStateId` on a Task to reuse an existing named browser cookie state. Set `cookieStateId: null` to run with a fresh state, or omit it to use the instance default. The legacy `statelessExecution` field is deprecated. Cookie-state administration requires an authenticated workspace session; scoped API keys can reference existing states but cannot manage them.

For Baserow Task outputs, `output.databaseId` identifies the database and `output.dedicated` indicates a dedicated table (Figranium v0.21+). These fields are part of the Task payload, not SDK access to Baserow credential or database administration.

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

## Browser interaction helpers

The SDK also exposes typed helpers for native browser interactions, including checkbox state, drag-and-drop, page reloads, option selection, and click modes:

```ts
actions.check("#terms");
actions.click(".file-row", "double");
actions.dragAndDrop(".backlog-card", ".done-column");
actions.reload();
actions.select("#language", "en");
```

Tasks can opt into rendered-page translation for Agent and headful runs. It is disabled by default:

```ts
translation: { enabled: true, targetLanguage: "spanish" }
```

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
| `tasks` | Save, update, delete, version, generate, and run Tasks |
| `executions` | List, inspect, stop, delete, clear, and stream executions |
| `schedules` | Inspect and configure Task schedules (workspace-session authentication required by the server) |
| `captures` | List and delete recordings and screenshots; no legacy global cookie administration |
| `cabinets` | Manage download Cabinets and their items |
| `cookieStates` | Manage named browser cookie states (workspace session required; mutations also require CSRF protection) |
| `templates` | Browse, search, and retrieve Templates; record successful imports |
| `execution` | Direct `scrape`, `agent`, and `headful` execution endpoints |
| `health` | Service health check |

Convenience aliases are available at `figranium.runTask()`, `figranium.scrape()`, `figranium.agent()`, and `figranium.headful()`.

**Execution listing:** `executions.list()` automatically uses `/api/executions/list` for API-key clients and `/api/executions` for workspace-session clients, matching the server's distinct authentication requirements. Set `apiKeyRoute: true` or `false` only to override that default. Other execution management operations may require a workspace session.

**Authentication and permissions:** Scoped API keys only authorize the Task and execution operations permitted by their scopes and optional Task allowlists. Having an SDK method does not mean the server accepts an API key for it. Cookie-state management, schedule administration, Baserow credentials, 1Password Vault configuration, import/export administration, and Cloud authentication handoff must not be treated as general API-key operations. Use the authenticated Figranium workspace for administrative operations. The SDK does not expose credential, Vault, settings, or Cloud-auth administration resources.

See [docs/API.md](docs/API.md) for the current method index and [examples/basic.ts](examples/basic.ts) for a complete example.

## Custom fetch

Proxies, tracing, test doubles, and cookie jars can be integrated without adapters:

```ts
const figranium = new Figranium({
  apiKey: "...",
  fetch: instrumentedFetch,
  headers: { "x-client-name": "my-service" },
});
```

## License

Apache-2.0
