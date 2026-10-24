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
- `tasks.clearVersions(id)`
- `tasks.rollback(id, versionId)`
- `tasks.generateSelector({ task, actionIndex, prompt })`
- `tasks.generateScript(description)`
- `tasks.run(id, input?)`

On Figranium v0.21+, Tasks can reference `cookieStateId` (string for a named state, `null` for fresh, omitted for the instance default). Baserow Task output typing includes `databaseId` and `dedicated`. Scoped keys must have the relevant permissions and respect Task allowlists.

## Executions

- `executions.list({ apiKeyRoute? })` — defaults to `/api/executions` with `session: true`, or `/api/executions/list` with an API key; `apiKeyRoute` overrides this selection
- `executions.get(id)`
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

## Templates

- `templates.list()`
- `templates.search({ limit?, offset?, sort?, category?, search? })`
- `templates.get(id)`
- `templates.recordImport(id)` — call only after successful local import

## Direct execution

- `execution.scrape(input)`
- `execution.agent(input)`
- `execution.headful(input)`

## Health

- `health.check()`

## Helpers

- `variable(name)` creates a `{$name}` token.
- `action(input)` adds an action ID to a typed action.
- `actions` provides navigation, interaction, extraction, control-flow, HTTP, and CAPTCHA helpers.
- `FigraniumError` normalizes HTTP and transport failures.

## Scope of the SDK

The v0.7+ SDK deliberately does **not** expose `auth`, `credentials`, `settings`, `browser`, or `apiKeys` administration resources. Baserow credentials, 1Password Vault setup, import/export administration, and Cloud authentication handoff belong to workspace/session flows, not generic scoped API-key automation. Server authorization remains authoritative for every method.
