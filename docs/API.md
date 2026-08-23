# API method index

All methods return promises unless marked as a stream. The final optional argument is a request options object with `signal`, `timeoutMs`, and `headers`.

## Top level

- `runTask(id, input?)`
- `scrape(input)`
- `agent(input)`
- `headful(input)`

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

## Executions

- `executions.list()` — uses the API-key-compatible list route by default
- `executions.get(id)`
- `executions.delete(id)`
- `executions.clear()`
- `executions.stop({ runId?, executionId? })`
- `executions.stream()` — `AsyncIterable<StreamEvent>`

## Schedules

- `schedules.list()`
- `schedules.set(taskId, schedule)`
- `schedules.delete(taskId)`
- `schedules.status(taskId)`
- `schedules.describe(taskId, schedule)`
- `schedules.overallStatus()`

## Captures and cookies

- `captures.list({ runId? })`
- `captures.screenshots()`
- `captures.delete(name)`
- `captures.cookies()`
- `captures.deleteCookie({ name, domain?, path? })`
- `captures.clear()`
- `captures.clearCookies()`

## Credentials

- `credentials.list()`
- `credentials.create(input)`
- `credentials.update(id, input)`
- `credentials.delete(id)`
- `credentials.baserowDatabases(id)`
- `credentials.baserowTables(id, databaseId)`

## Browser and headful sessions

- `browser.open(input?)`
- `browser.highlight(input)`
- `browser.stopHeadful()`
- `browser.headfulStatus()`
- `browser.inspect()`
- `browser.vncPassword()`
- `browser.selectorStream()` — `AsyncIterable<StreamEvent>`

## Settings (session required)

- `settings.getApiKey()` / `settings.setApiKey(apiKey?)`
- `settings.getUserAgent()` / `settings.setUserAgent(selection)`
- `settings.getAiModels()` / `settings.setAiModels(models)`
- `settings.getProviderKeys(provider)` / `settings.setProviderKeys(provider, keys)`
- `settings.getTheme()` / `settings.setTheme(theme)`
- `settings.listProxies()`
- `settings.addProxy(proxy)` / `settings.importProxies(proxies)`
- `settings.updateProxy(id, proxy)`
- `settings.deleteProxy(id)` / `settings.deleteProxies(ids)`
- `settings.setDefaultProxy(id)`
- `settings.setProxyRotation(input)`

## Authentication and health

- `auth.checkSetup()`
- `auth.setup(input)`
- `auth.login(input)`
- `auth.logout()`
- `auth.me()`
- `health.check()`

## Helpers

- `variable(name)` creates a `{$name}` template token.
- `action(input)` adds an action ID to any valid typed action.
- `actions` contains helpers for common navigation, interaction, extraction, control-flow, HTTP, and CAPTCHA actions.
- `FigraniumError` contains normalized HTTP and transport failure details.
