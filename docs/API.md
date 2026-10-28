# API method index

This index reflects the JavaScript SDK source as of v0.7.1. All methods return promises unless marked as a stream. The final optional argument accepts `signal`, `timeoutMs`, and `headers`.

## Top level

- `runTask(id, input?)`
- `scrape(input)`
- `agent(input)`
- `headful(input)`

Execution results can report `success`, `error`, `stopped`, `crashed`, or `anti_bot` as their `outcome`. Check the outcome rather than relying only on HTTP status.

## Tasks

- `tasks.list()`
- `tasks.listSummaries()`
- `tasks.save(task, { createVersion? })`
- `tasks.touch(id)`
- `tasks.update(id, patch)`
- `tasks.delete(id)`
- `tasks.versions(id)`
- `tasks.version(id, versionId)`
- `tasks.deleteVersion(id, versionId)` — deletes one saved version; requires an authenticated workspace session
- `tasks.clearVersions(id)`
- `tasks.rollback(id, versionId)`
- `tasks.run(id, input?)`

`tasks.listSummaries()` uses `/api/tasks/list` with API keys and `/api/tasks` with workspace sessions (`session: true`), normalizing both responses to `{ tasks: TaskSummary[] }`.

The former AI-based `tasks.generateSelector()` and `tasks.generateScript()` methods are not available: their server routes are absent in v0.20.0 and v0.21.x.

On Figranium v0.21+, Tasks can reference `cookieStateId` (string for a named state, `null` for fresh, omitted for the instance default). Baserow Task output typing includes `databaseId` and `dedicated`. Scoped keys must have the relevant permissions and respect Task allowlists.

## Executions

- `executions.list({ apiKeyRoute? })` — defaults to `/api/executions` with `session: true`, or `/api/executions/list` with an API key; `apiKeyRoute` overrides this selection
- `executions.get(id)`
- `executions.getFullResult<T>(id)` — fetches `{ result: T }` from `/api/executions/:id/result`; available only when the server has retained a full result; API keys require `results:read` and must allow the execution's Task
- `executions.delete(id)`
- `executions.clear()`
- `executions.stop({ runId })`
- `executions.stream(runId, options?)` — `AsyncIterable<StreamEvent>`; requires a workspace session and the run ID (`GET /api/executions/stream?runId=...`)

## Schedules

- `schedules.list()`
- `schedules.set(taskId, schedule)`
- `schedules.delete(taskId)`
- `schedules.status(taskId)`
- `schedules.describe(taskId, schedule)`
- `schedules.overallStatus()`

These server routes require an authenticated workspace session; an API key alone is not sufficient for schedule administration.

## Captures

- `captures.list({ runId? })`
- `captures.screenshots()`
- `captures.delete(name)`
- `captures.clear()`

Legacy `captures.cookies()`, `captures.deleteCookie()`, and `captures.clearCookies()` were removed in v0.7.0.

## Cabinets

- `cabinets.list()`
- `cabinets.create(name)`
- `cabinets.rename(cabinetId, name)`
- `cabinets.delete(cabinetId, { targetCabinetId?, migrate? })`
- `cabinets.listItems(cabinetId)`
- `cabinets.clear(cabinetId)`
- `cabinets.setItemStatus(cabinetId, itemIds, status)`
- `cabinets.removeItems(cabinetId, itemIds)`
- `cabinets.zipItems(cabinetId, itemIds, name?)`
- `cabinets.unzipItem(cabinetId, itemId)`
- `cabinets.getItemDownloadUrl(cabinetId, itemId)` — URL builder, not an authenticated fetch

## Cookie states (workspace session required)

- `cookieStates.list()`
- `cookieStates.get(id)`
- `cookieStates.create({ name, state })`
- `cookieStates.rename(id, name)`
- `cookieStates.update(id, state)`
- `cookieStates.delete(id)`

Cookie-state management is session-authenticated, and mutations require CSRF protection. Scoped API keys may reference existing cookie states on Tasks but cannot administer states.

## Templates (workspace session required)

The core `/api/templates` endpoints use `requireAuth`. Configure the SDK with `session: true`; scoped API keys cannot list, search, retrieve, or record imports for Templates.

- `templates.list()`
- `templates.search({ limit?, offset?, sort?, category?, search? })`
- `templates.get(id)`
- `templates.recordImport(id)` — call only after successful local import

## Direct execution (workspace session required)

- `execution.scrape(input)`
- `execution.agent(input)`
- `execution.headful(input)`

These methods and their top-level aliases call `/scrape`, `/agent`, and `/headful`, which require a workspace session (`requireAuth` in Figranium's server). An API key alone cannot invoke them. For API-key-based automation, use `tasks.run(id, input?)` or `runTask(id, input?)` with `tasks:run` permission and a permitted Task ID.

## Health

- `health.check()`

## Helpers

- `variable(name)` creates a `{$name}` token.
- `action(input)` adds an action ID to a typed action.
- `actions` provides navigation, interaction, extraction, control-flow, HTTP, and CAPTCHA helpers.
- `FigraniumError` normalizes HTTP and transport failures.

## Scope of the SDK

The v0.7+ SDK deliberately does **not** expose `auth`, `credentials`, `settings`, `browser`, or `apiKeys` administration resources. Baserow credentials, 1Password Vault setup, import/export administration, and Cloud authentication handoff belong to workspace/session flows, not generic scoped API-key automation. Server authorization remains authoritative for every method.
