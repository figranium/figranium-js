import { HttpClient } from "./http";
import {
  AuthResource,
  BrowserResource,
  CabinetsResource,
  CapturesResource,
  CredentialsResource,
  ExecutionResource,
  ExecutionsResource,
  HealthResource,
  SchedulesResource,
  SettingsResource,
  TasksResource,
} from "./resources";
import type { ExecuteTaskOptions, ExecutionResult, FigraniumOptions, RequestOptions, UnknownRecord } from "./types";

export class Figranium {
  readonly auth: AuthResource;
  readonly tasks: TasksResource;
  readonly executions: ExecutionsResource;
  readonly schedules: SchedulesResource;
  readonly captures: CapturesResource;
  readonly cabinets: CabinetsResource;
  readonly credentials: CredentialsResource;
  readonly browser: BrowserResource;
  readonly settings: SettingsResource;
  readonly execution: ExecutionResource;
  readonly health: HealthResource;

  constructor(options: FigraniumOptions = {}) {
    const http = new HttpClient(options);
    this.auth = new AuthResource(http);
    this.tasks = new TasksResource(http);
    this.executions = new ExecutionsResource(http);
    this.schedules = new SchedulesResource(http);
    this.captures = new CapturesResource(http);
    this.cabinets = new CabinetsResource(http);
    this.credentials = new CredentialsResource(http);
    this.browser = new BrowserResource(http);
    this.settings = new SettingsResource(http);
    this.execution = new ExecutionResource(http);
    this.health = new HealthResource(http);
  }

  runTask<T = unknown>(id: string, input: ExecuteTaskOptions = {}, options?: RequestOptions): Promise<ExecutionResult<T>> {
    return this.tasks.run<T>(id, input, options);
  }

  scrape<T = unknown>(input: UnknownRecord & { url?: string }, options?: RequestOptions): Promise<ExecutionResult<T>> {
    return this.execution.scrape<T>(input, options);
  }

  agent<T = unknown>(input: UnknownRecord, options?: RequestOptions): Promise<ExecutionResult<T>> {
    return this.execution.agent<T>(input, options);
  }

  headful<T = unknown>(input: UnknownRecord & { url?: string }, options?: RequestOptions): Promise<ExecutionResult<T>> {
    return this.execution.headful<T>(input, options);
  }
}
