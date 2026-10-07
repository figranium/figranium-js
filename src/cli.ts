#!/usr/bin/env node
import { Figranium } from "./client";
import type { RuntimeVariables, TaskOutcome } from "./types";

export const EXIT_SUCCESS = 0;
export const EXIT_TASK_FAILED = 1;
export const EXIT_CLI_ERROR = 2;

type CliOptions = {
  taskId: string;
  baseUrl?: string;
  apiKey?: string;
  variables: RuntimeVariables;
  timeoutMs?: number;
  json: boolean;
};

function usage(): string {
  return `Usage: figranium run <task-id> [options]

Run a saved Figranium Task and return a CI-friendly exit code.

Options:
  --url <url>             Figranium instance URL (or FIGRANIUM_URL)
  --api-key <key>         API key (or FIGRANIUM_API_KEY)
  --var <name=value>      Runtime variable; repeatable
  --timeout <ms>          Request timeout in milliseconds
  --json                  Print the complete result as JSON
  -h, --help              Show help

Exit codes:
  0  Task succeeded
  1  Task completed unsuccessfully
  2  CLI, authentication, network, or configuration error
`;
}

function parseValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value !== "" && Number.isFinite(Number(value))) return Number(value);
  return value;
}

export function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): CliOptions | "help" {
  if (argv.includes("-h") || argv.includes("--help")) return "help";
  const [command, taskId, ...rest] = argv;
  if (command !== "run" || !taskId) throw new Error("Expected: figranium run <task-id>");

  const options: CliOptions = {
    taskId,
    baseUrl: env.FIGRANIUM_URL,
    apiKey: env.FIGRANIUM_API_KEY,
    variables: {},
    json: false,
  };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    const value = rest[++i];
    if (!value) throw new Error(`Missing value for ${arg}`);
    if (arg === "--url") options.baseUrl = value;
    else if (arg === "--api-key") options.apiKey = value;
    else if (arg === "--timeout") {
      const timeoutMs = Number(value);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout must be a positive number");
      options.timeoutMs = timeoutMs;
    } else if (arg === "--var") {
      const separator = value.indexOf("=");
      if (separator < 1) throw new Error("--var must use name=value");
      options.variables[value.slice(0, separator)] = parseValue(value.slice(separator + 1));
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.apiKey) throw new Error("Missing API key. Use --api-key or FIGRANIUM_API_KEY.");
  return options;
}

function succeeded(outcome?: TaskOutcome, success?: boolean): boolean {
  return outcome === "success" || (outcome === undefined && success === true);
}

export async function main(
  argv = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  try {
    const options = parseArgs(argv, env);
    if (options === "help") {
      process.stdout.write(usage());
      return EXIT_SUCCESS;
    }

    const client = new Figranium({
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      timeoutMs: options.timeoutMs,
    });

    process.stderr.write(`Running Figranium Task ${options.taskId}...\n`);
    const result = await client.runTask(options.taskId, {
      variables: options.variables,
    }, options.timeoutMs ? { timeoutMs: options.timeoutMs } : undefined);

    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

    if (succeeded(result.outcome, result.success)) {
      process.stderr.write(`Task succeeded${result.runId ? ` (run ${result.runId})` : ""}.\n`);
      return EXIT_SUCCESS;
    }

    const outcome = result.outcome ?? "unsuccessful";
    process.stderr.write(`Task failed: ${outcome}${result.error ? ` — ${result.error}` : ""}\n`);
    return EXIT_TASK_FAILED;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Figranium CLI error: ${message}\n`);
    return EXIT_CLI_ERROR;
  }
}

const isEntryPoint = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isEntryPoint) {
  main().then((code) => {
    process.exitCode = code;
  });
}
