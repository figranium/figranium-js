# Changelog

All notable changes to `@figranium/sdk` are documented here.

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
