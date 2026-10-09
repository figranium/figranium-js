# Changelog

All notable changes to `@figranium/sdk` are documented here.

## 0.6.0 - 2026-10-09

- Added typed session-only scoped API key management (list, create with permissions and task allowlists, revoke).
- Added reusable Playwright cookie-state management (list, inspect, create, rename, update, delete).
- Added endpoint and serialization regression tests for Figranium v0.21.0.

## 0.5.0 - 2026-10-07

- Added the `figranium run <task-id>` CLI for CI and command-line Task execution.
- Added `FIGRANIUM_URL` and `FIGRANIUM_API_KEY` environment configuration, repeatable typed `--var` inputs, `--timeout`, and `--json`.
- Added stable CI exit codes: `0` for success, `1` for unsuccessful Task outcomes, and `2` for CLI/configuration/transport failures.

## 0.4.0 - 2026-10-03

- Added v0.20 template catalog listing, paginated search, detail retrieval, and explicit successful-import tracking.
- Exported the Templates resource.



## 0.3.0 - 2026-09-11

- Added typed `check`, `uncheck`, `drag_and_drop`, and `reload` actions, with `actions.check()`, `actions.uncheck()`, `actions.dragAndDrop()`, and `actions.reload()` helpers.
- Added `clickType` support for single, double, and right-click interactions through `actions.click(selector, clickType?)`.
- Added the existing native `select` and `do_nothing` actions to the public action union and helpers.
- Added the Task-level `translation` contract for opt-in rendered-page translation in Agent and headful runs.
- Corrected the Task download Cabinet field to `downloadCabinetId`; retained `cabinetId` as a deprecated compatibility alias in the SDK type.
- Corrected Cabinet item statuses to `unuploaded` and `uploaded`.

## 0.2.0 - 2026-09-05

- Added the typed `TaskOutcome` contract to execution results, execution history, and schedule metadata.
- Added a `CabinetsResource` (`client.cabinets`) for listing, creating, renaming, and deleting Cabinets, managing their items (list, clear, set status, remove, zip, unzip), and building item download URLs.
- Added the typed `upload` and `finalize_uploads` actions with `cabinetId`/`markAsUploaded` fields, plus `actions.upload()` and `actions.finalizeUploads()` helpers.
- Added the optional `cabinetId` field to `Task` for per-Task download Cabinet selection.

## 0.1.1 - 2026-08-25

- Added the typed `wait_captcha` action with optional CAPTCHA provider, selector scope, timeout, and result variable fields.
- Added `actions.waitForCaptcha()` for creating CAPTCHA readiness gates alongside `actions.solveCaptcha()`.
- Documented the readiness/solve action sequence and added declaration/helper regression coverage.

## 0.1.0 - 2026-08-23

- Initial TypeScript/JavaScript SDK release.
- Typed clients for tasks, executions, schedules, captures, credentials, browser sessions, settings, authentication, and health.
- Direct scrape, agent, headful, and saved-task execution helpers.
- Abortable SSE streams for execution and selector events.
- Task action and variable-template helpers.
- ESM and CommonJS builds with TypeScript declarations.
