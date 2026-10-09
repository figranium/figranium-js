import { HttpClient, pathId } from "./http";
import type {
  BrowserSession,
  BrowserCookieState,
  NamedCookieState,
  Cabinet,
  CabinetItem,
  CabinetItemStatus,
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

  clear(options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", "/api/data/clear-screenshots", options);
  }


}

export class CabinetsResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.request<Cabinet[]>("GET", "/api/cabinets", options);
  }

  create(name: string, options?: RequestOptions) {
    return this.http.request<Cabinet>("POST", "/api/cabinets", { ...options, body: { name } });
  }

  rename(cabinetId: string, name: string, options?: RequestOptions) {
    return this.http.request<Cabinet>("PATCH", `/api/cabinets/${pathId(cabinetId)}`, { ...options, body: { name } });
  }

  delete(cabinetId: string, input: { targetCabinetId?: string; migrate?: boolean } = {}, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("DELETE", `/api/cabinets/${pathId(cabinetId)}`, {
      ...options,
      body: { targetCabinetId: input.targetCabinetId, mode: input.migrate ? "migrate" : undefined },
    });
  }

  listItems(cabinetId: string, options?: RequestOptions) {
    return this.http.request<{ items: CabinetItem[] }>("GET", `/api/cabinets/${pathId(cabinetId)}/items`, options);
  }

  clear(cabinetId: string, options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("POST", `/api/cabinets/${pathId(cabinetId)}/clear`, options);
  }

  setItemStatus(cabinetId: string, itemIds: string[], status: CabinetItemStatus, options?: RequestOptions) {
    return this.http.request<{ items: CabinetItem[] }>("PATCH", `/api/cabinets/${pathId(cabinetId)}/items/status`, {
      ...options,
      body: { itemIds, status },
    });
  }

  removeItems(cabinetId: string, itemIds: string[], options?: RequestOptions) {
    return this.http.request<{ success: boolean }>("DELETE", `/api/cabinets/${pathId(cabinetId)}/items`, {
      ...options,
      body: { itemIds },
    });
  }

  zipItems(cabinetId: string, itemIds: string[], name?: string, options?: RequestOptions) {
    return this.http.request<CabinetItem>("POST", `/api/cabinets/${pathId(cabinetId)}/zip`, {
      ...options,
      body: { itemIds, name },
    });
  }

  unzipItem(cabinetId: string, itemId: string, options?: RequestOptions) {
    return this.http.request<{ items: CabinetItem[] }>("POST", `/api/cabinets/${pathId(cabinetId)}/items/${pathId(itemId)}/unzip`, options);
  }

  getItemDownloadUrl(cabinetId: string, itemId: string): string {
    return `${this.http.baseUrl}/api/cabinets/${pathId(cabinetId)}/items/${pathId(itemId)}/download`;
  }
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

/** Cookie-state management requires workspace-session authentication and CSRF protection on mutations. */
export class CookieStatesResource {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.request<{ states: NamedCookieState[] }>("GET", "/api/cookie-states", options);
  }

  get(id: string, options?: RequestOptions) {
    return this.http.request<NamedCookieState & { state: BrowserCookieState }>("GET", `/api/cookie-states/${pathId(id)}`, options);
  }

  create(input: { name: string; state: BrowserCookieState }, options?: RequestOptions) {
    return this.http.request<NamedCookieState>("POST", "/api/cookie-states", { ...options, body: input });
  }

  rename(id: string, name: string, options?: RequestOptions) {
    return this.http.request<NamedCookieState>("PATCH", `/api/cookie-states/${pathId(id)}`, { ...options, body: { name } });
  }

  update(id: string, state: BrowserCookieState, options?: RequestOptions) {
    return this.http.request<NamedCookieState>("PATCH", `/api/cookie-states/${pathId(id)}`, { ...options, body: { state } });
  }

  delete(id: string, options?: RequestOptions) {
    return this.http.request<{ ok: boolean }>("DELETE", `/api/cookie-states/${pathId(id)}`, options);
  }
}
