import { HttpClient, pathId } from "./http";
import type {
  BrowserSession,
  Capture,
  Credential,
  CredentialInput,
  ExecuteTaskOptions,
  Execution,
  ExecutionResult,
  HealthStatus,
  ProxyInput,
  ProxyList,
  RequestOptions,
  RuntimeVariables,
  Schedule,
  ScheduleEntry,
  SelectorCandidate,
  StreamEvent,
  Task,
  TaskSummary,
  TaskVersion,
  UnknownRecord,
  User,
} from "./types";

export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  checkSetup(options?: RequestOptions) {
    return this.http.request<{ setupRequired: boolean }>("GET", "/api/auth/check-setup", options);
  }

  setup(input: { name: string; email: string; password: string }, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/auth/setup", { ...options, body: input });
  }

  login(input: { email: string; password: string }, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/auth/login", { ...options, body: input });
  }

  logout(options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/auth/logout", options);
  }

  me(options?: RequestOptions) {
    return this.http.request<{ user: User }>("GET", "/api/auth/me", options);
  }
}

export class TasksResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.request<Task[]>("GET", "/api/tasks", options);
  }

  listSummaries(options?: RequestOptions) {
    return this.http.request<{ tasks: TaskSummary[] }>("GET", "/api/tasks/list", options);
  }

  save(task: Task, options: RequestOptions & { createVersion?: boolean } = {}) {
    const { createVersion, ...request } = options;
    return this.http.request<Task>("POST", "/api/tasks", {
      ...request,
      query: { version: createVersion ? "true" : undefined },
      body: task,
    });
  }

  touch(id: string, options?: RequestOptions) {
    return this.http.request<Task>("POST", `/api/tasks/${pathId(id)}/touch`, options);
  }

  update(id: string, patch: Partial<Task>, options?: RequestOptions) {
    return this.http.request<{ id: string; updatedAt: number; status: string; task: Task }>(
      "PATCH",
      `/api/tasks/${pathId(id)}`,
      { ...options, body: patch },
    );
  }

  delete(id: string, options?: RequestOptions) {
    return this.http.request<{ id: string; deleted: boolean; message?: string }>(
      "DELETE",
      `/api/tasks/${pathId(id)}`,
      options,
    );
  }

  versions(id: string, options?: RequestOptions) {
    return this.http.request<{ versions: TaskVersion[] }>("GET", `/api/tasks/${pathId(id)}/versions`, options);
  }

  version(id: string, versionId: string, options?: RequestOptions) {
    return this.http.request<{ snapshot: Task; metadata: { id: string; timestamp: number } }>(
      "GET",
      `/api/tasks/${pathId(id)}/versions/${pathId(versionId)}`,
      options,
    );
  }

  clearVersions(id: string, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", `/api/tasks/${pathId(id)}/versions/clear`, options);
  }

  rollback(id: string, versionId: string, options?: RequestOptions) {
    return this.http.request<Task>("POST", `/api/tasks/${pathId(id)}/rollback`, {
      ...options,
      body: { versionId },
    });
  }

  generateSelector(input: { task: Task; actionIndex: number; prompt: string }, options?: RequestOptions) {
    return this.http.request<{ selector: string }>("POST", "/api/tasks/generate-selector", { ...options, body: input });
  }

  generateScript(description: string, options?: RequestOptions) {
    return this.http.request<{ script: string }>("POST", "/api/tasks/generate-script", {
      ...options,
      body: { description },
    });
  }

  run<T = unknown>(id: string, input: ExecuteTaskOptions = {}, options?: RequestOptions) {
    return this.http.request<ExecutionResult<T>>("POST", `/tasks/${pathId(id)}/api`, {
      ...options,
      body: input,
    });
  }
}

export class ExecutionsResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions & { apiKeyRoute?: boolean }) {
    const { apiKeyRoute, ...request } = options ?? {};
    return this.http.request<{ executions: Execution[] }>(
      "GET",
      apiKeyRoute === false ? "/api/executions" : "/api/executions/list",
      request,
    );
  }

  get<T = unknown>(id: string, options?: RequestOptions) {
    return this.http.request<{ execution: Execution<T> }>("GET", `/api/executions/${pathId(id)}`, options);
  }

  delete(id: string, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("DELETE", `/api/executions/${pathId(id)}`, options);
  }

  clear(options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/executions/clear", options);
  }

  stop(input: { runId: string }, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/executions/stop", { ...options, body: input });
  }

  stream<T = unknown>(options?: RequestOptions): AsyncIterable<StreamEvent<T>> {
    return this.http.stream<T>("/api/executions/stream", options);
  }
}

export class SchedulesResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.request<{ schedules: ScheduleEntry[] }>("GET", "/api/schedules", options);
  }

  set(taskId: string, schedule: Schedule, options?: RequestOptions) {
    return this.http.request<{ schedule: Schedule; description: string | null; nextRun: number | null }>(
      "POST",
      `/api/schedules/${pathId(taskId)}`,
      { ...options, body: schedule },
    );
  }

  delete(taskId: string, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("DELETE", `/api/schedules/${pathId(taskId)}`, options);
  }

  status(taskId: string, options?: RequestOptions) {
    return this.http.request<{ schedule: Schedule; cron: string | null; description: string | null; isValid: boolean }>(
      "GET",
      `/api/schedules/${pathId(taskId)}/status`,
      options,
    );
  }

  describe(taskId: string, schedule: Schedule, options?: RequestOptions) {
    return this.http.request<{ valid: boolean; description: string | null; cron: string | null; nextRun: number | null }>("POST", `/api/schedules/${pathId(taskId)}/describe`, {
      ...options,
      body: schedule,
    });
  }

  overallStatus(options?: RequestOptions) {
    return this.http.request<UnknownRecord>("GET", "/api/schedules/status/all", options);
  }
}

export class CapturesResource {
  constructor(private readonly http: HttpClient) {}

  list(input: { runId?: string } = {}, options?: RequestOptions) {
    return this.http.request<{ captures: Capture[] }>("GET", "/api/data/captures", { ...options, query: input });
  }

  screenshots(options?: RequestOptions) {
    return this.http.request<{ screenshots: Capture[] }>("GET", "/api/data/screenshots", options);
  }

  delete(name: string, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("DELETE", `/api/data/captures/${pathId(name)}`, options);
  }

  cookies(options?: RequestOptions) {
    return this.http.request<{ cookies: UnknownRecord[]; origins: UnknownRecord[] }>("GET", "/api/data/cookies", options);
  }

  deleteCookie(cookie: { name: string; domain?: string; path?: string }, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/data/cookies/delete", {
      ...options,
      body: cookie,
    });
  }

  clear(options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/data/clear-screenshots", options);
  }

  clearCookies(options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/data/clear-cookies", options);
  }
}

export class CredentialsResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.request<Credential[]>("GET", "/api/credentials", options);
  }

  create(input: CredentialInput, options?: RequestOptions) {
    return this.http.request<Credential>("POST", "/api/credentials", { ...options, body: input });
  }

  update(id: string, input: Partial<Pick<CredentialInput, "name" | "config">>, options?: RequestOptions) {
    return this.http.request<Credential>("PUT", `/api/credentials/${pathId(id)}`, { ...options, body: input });
  }

  delete(id: string, options?: RequestOptions) {
    return this.http.request<{ ok: boolean }>("DELETE", `/api/credentials/${pathId(id)}`, options);
  }

  baserowDatabases(id: string, options?: RequestOptions) {
    return this.http.request<Array<{ id: string; name: string; workspaceName: string }>>(
      "GET",
      `/api/credentials/${pathId(id)}/proxy/baserow/databases`,
      options,
    );
  }

  baserowTables(id: string, databaseId: string | number, options?: RequestOptions) {
    return this.http.request<Array<{ id: string; name: string }>>(
      "GET",
      `/api/credentials/${pathId(id)}/proxy/baserow/databases/${pathId(databaseId)}/tables`,
      options,
    );
  }
}

export class BrowserResource {
  constructor(private readonly http: HttpClient) {}

  open(
    input: { url?: string; mode?: "headful" | "scrape" | "agent"; devTools?: boolean; headless?: boolean } = {},
    options?: RequestOptions,
  ) {
    return this.http.request<BrowserSession>("POST", "/api/browser/open", { ...options, body: input });
  }

  highlight(
    input: { sessionId?: string; url?: string; targetHint?: string },
    options?: RequestOptions,
  ) {
    return this.http.request<{ success: boolean; selectors: SelectorCandidate[]; snapshot: string | null }>(
      "POST",
      "/api/inspector/highlight",
      { ...options, body: input },
    );
  }

  stopHeadful(options?: RequestOptions) {
    return this.http.request<UnknownRecord>("POST", "/headful/stop", options);
  }

  headfulStatus(options?: RequestOptions) {
    return this.http.request<{ useNovnc: boolean }>("GET", "/api/headful/status", options);
  }

  inspect(options?: RequestOptions) {
    return this.http.request<UnknownRecord>("POST", "/api/headful/inspect", options);
  }

  vncPassword(options?: RequestOptions) {
    return this.http.request<{ password: string }>("GET", "/api/headful/vnc-password", options);
  }

  selectorStream<T = UnknownRecord>(options?: RequestOptions): AsyncIterable<StreamEvent<T>> {
    return this.http.stream<T>("/api/headful/selector_stream", options);
  }
}

/** Settings endpoints require an authenticated Figranium browser session. */
export class SettingsResource {
  constructor(private readonly http: HttpClient) {}

  getApiKey(options?: RequestOptions) { return this.http.request<{ apiKey: string | null }>("GET", "/api/settings/api-key", options); }
  setApiKey(apiKey?: string, options?: RequestOptions) { return this.http.request<{ apiKey: string }>("POST", "/api/settings/api-key", { ...options, body: apiKey ? { apiKey } : {} }); }
  getUserAgent(options?: RequestOptions) { return this.http.request<UnknownRecord>("GET", "/api/settings/user-agent", options); }
  setUserAgent(selection: string | null, options?: RequestOptions) { return this.http.request<UnknownRecord>("POST", "/api/settings/user-agent", { ...options, body: { selection } }); }
  getAiModels(options?: RequestOptions) { return this.http.request<AiModels>("GET", "/api/settings/ai-models", options); }
  setAiModels(models: AiModels, options?: RequestOptions) { return this.http.request<AiModels>("POST", "/api/settings/ai-models", { ...options, body: models }); }
  getTheme(options?: RequestOptions) { return this.http.request<{ theme: Theme }>("GET", "/api/settings/theme", options); }
  setTheme(theme: Theme, options?: RequestOptions) { return this.http.request<{ theme: Theme }>("POST", "/api/settings/theme", { ...options, body: { theme } }); }
  listProxies(options?: RequestOptions) { return this.http.request<ProxyList>("GET", "/api/settings/proxies", options); }
  addProxy(proxy: ProxyInput, options?: RequestOptions) { return this.http.request<ProxyList>("POST", "/api/settings/proxies", { ...options, body: proxy }); }
  importProxies(proxies: ProxyInput[], options?: RequestOptions) { return this.http.request<ProxyList>("POST", "/api/settings/proxies/import", { ...options, body: { proxies } }); }
  updateProxy(id: string, proxy: ProxyInput, options?: RequestOptions) { return this.http.request<ProxyList>("PUT", `/api/settings/proxies/${pathId(id)}`, { ...options, body: proxy }); }
  deleteProxy(id: string, options?: RequestOptions) { return this.http.request<ProxyList>("DELETE", `/api/settings/proxies/${pathId(id)}`, options); }
  deleteProxies(ids: string[], options?: RequestOptions) { return this.http.request<ProxyList>("DELETE", "/api/settings/proxies", { ...options, body: { ids } }); }
  setDefaultProxy(id: string | null, options?: RequestOptions) { return this.http.request<ProxyList>("POST", "/api/settings/proxies/default", { ...options, body: { id } }); }
  setProxyRotation(input: { includeDefaultInRotation?: boolean; rotationMode?: "round-robin" | "random" }, options?: RequestOptions) { return this.http.request<ProxyList>("POST", "/api/settings/proxies/rotation", { ...options, body: input }); }

  getProviderKeys(provider: AiProvider, options?: RequestOptions) {
    return this.http.request<Record<string, string[]>>("GET", `/api/settings/${providerPath(provider)}`, options);
  }

  setProviderKeys(provider: AiProvider, keys: string[], options?: RequestOptions) {
    const responseKey = provider === "openai" ? "openAiApiKeys" : `${provider}ApiKeys`;
    return this.http.request<Record<string, string[]>>("POST", `/api/settings/${providerPath(provider)}`, {
      ...options,
      body: { [responseKey]: keys },
    });
  }
}

export type AiProvider = "gemini" | "openai" | "claude" | "ollama";
export type AiModels = Partial<Record<AiProvider, string>>;
export type Theme = "dark" | "light" | "solarized-light" | "solarized-dark";

function providerPath(provider: AiProvider) {
  return provider === "openai" ? "openai-api-key" : `${provider}-api-key`;
}

export class ExecutionResource {
  constructor(private readonly http: HttpClient) {}

  scrape<T = unknown>(input: UnknownRecord & { url?: string; selector?: string; extractionScript?: string; variables?: RuntimeVariables; taskVariables?: RuntimeVariables }, options?: RequestOptions) {
    return this.http.request<ExecutionResult<T>>("POST", "/scrape", { ...options, body: input });
  }

  agent<T = unknown>(input: UnknownRecord & { runId?: string }, options?: RequestOptions) {
    return this.http.request<ExecutionResult<T>>("POST", "/agent", { ...options, body: input });
  }

  headful<T = unknown>(input: UnknownRecord & { url?: string; variables?: RuntimeVariables; taskVariables?: RuntimeVariables }, options?: RequestOptions) {
    return this.http.request<ExecutionResult<T>>("POST", "/headful", { ...options, body: input });
  }
}

export class HealthResource {
  constructor(private readonly http: HttpClient) {}
  check(options?: RequestOptions) { return this.http.request<HealthStatus>("GET", "/api/health", options); }
}
