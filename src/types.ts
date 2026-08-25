export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type UnknownRecord = Record<string, unknown>;

export type TaskMode = "scrape" | "agent" | "headful";
export type VariableType = "string" | "number" | "boolean";
export type ExtractionFormat = "json" | "csv";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type CaptchaType = "recaptcha_v2" | "recaptcha_v3" | "hcaptcha" | "turnstile";

export interface TaskVariable<T = unknown> {
  type: VariableType;
  value: T;
  autoCreated?: boolean;
}

export type TaskVariables = Record<string, TaskVariable>;
export type RuntimeVariables = Record<string, unknown>;

export interface ActionBase {
  id?: string;
  disabled?: boolean;
}

export interface SelectorAction extends ActionBase {
  selector: string;
}

export type Action =
  | (ActionBase & { type: "navigate"; value: string })
  | (SelectorAction & { type: "click" })
  | (SelectorAction & { type: "type"; value: string; typeMode?: "append" | "replace" })
  | (ActionBase & { type: "wait"; value: string })
  | (SelectorAction & { type: "wait_selector"; value?: string })
  | (ActionBase & { type: "wait_downloads"; value?: string })
  | (ActionBase & { type: "press"; key: string; selector?: string })
  | (ActionBase & { type: "scroll"; selector?: string; value?: string })
  | (ActionBase & { type: "javascript"; value: string; varName?: string })
  | (ActionBase & { type: "csv"; value?: string; selector?: string; varName?: string })
  | (SelectorAction & { type: "hover" })
  | (ActionBase & { type: "merge"; varName: string; value: string })
  | (ActionBase & { type: "screenshot"; value?: string })
  | ConditionAction<"if">
  | (ActionBase & { type: "else" })
  | (ActionBase & { type: "end" })
  | ConditionAction<"while">
  | (ActionBase & { type: "repeat"; value: string })
  | (ActionBase & { type: "foreach"; selector?: string; value?: string; varName?: string })
  | (ActionBase & { type: "stop"; value?: string })
  | (ActionBase & { type: "set"; varName: string; value: string })
  | (ActionBase & { type: "on_error"; value?: string })
  | (ActionBase & { type: "start"; value: string })
  | (ActionBase & {
      type: "http_request";
      value: string;
      method?: HttpMethod;
      headers?: string;
      body?: string;
      varName?: string;
    })
  | (ActionBase & { type: "get_content"; selector?: string; varName?: string })
  | (ActionBase & {
      type: "solve_captcha";
      captchaType?: CaptchaType;
      selector?: string;
      varName?: string;
      timeout?: number;
    })
  | (ActionBase & {
      type: "wait_captcha";
      captchaType?: CaptchaType;
      selector?: string;
      varName?: string;
      timeout?: number;
    });

export type StringConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "matches";
export type NumberConditionOperator = "equals" | "not_equals" | "gt" | "gte" | "lt" | "lte";
export type BooleanConditionOperator = "is_true" | "is_false";
export type SelectorConditionOperator = "exists" | "not_exists";
export type ConditionOperator =
  | StringConditionOperator
  | NumberConditionOperator
  | BooleanConditionOperator
  | SelectorConditionOperator;

export type ConditionAction<T extends "if" | "while"> = ActionBase & {
  type: T;
  value?: string;
  selector?: string;
  conditionVar?: string;
  conditionVarType?: VariableType;
  conditionOp?: ConditionOperator;
  conditionValue?: string;
};

export interface StealthConfig {
  allowTypos?: boolean;
  idleMovements?: boolean;
  overscroll?: boolean;
  deadClicks?: boolean;
  fatigue?: boolean;
  naturalTyping?: boolean;
  cursorGlide?: boolean;
  randomizeClicks?: boolean;
}

export interface Schedule {
  enabled: boolean;
  frequency?: "interval" | "hourly" | "daily" | "weekly" | "monthly";
  intervalMinutes?: number;
  hour?: number;
  minute?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  cron?: string;
}

export interface TaskOutput {
  provider: "baserow";
  credentialId: string;
  tableId: string;
  onError?: "ignore" | "fail";
}

export interface Task {
  id?: string;
  name: string;
  description?: string;
  url: string;
  mode: TaskMode;
  wait?: number;
  selector?: string;
  rotateUserAgents?: boolean;
  rotateProxies?: boolean;
  rotateViewport?: boolean;
  humanTyping?: boolean;
  stealth?: StealthConfig;
  autoSolveCaptcha?: boolean;
  actions?: Action[];
  variables?: TaskVariables;
  schedule?: Schedule;
  output?: TaskOutput;
  extractionScript?: string;
  extractionFormat?: ExtractionFormat;
  includeHtml?: boolean;
  includeShadowDom?: boolean;
  disableRecording?: boolean;
  statelessExecution?: boolean;
  versions?: TaskVersion[];
  last_opened?: number;
  [key: string]: unknown;
}

export interface TaskSummary {
  id: string;
  name: string;
  description?: string;
}

export interface TaskVersion {
  id: string;
  timestamp: number;
  name?: string;
  mode?: TaskMode | string;
}

export interface ExecuteTaskOptions extends UnknownRecord {
  variables?: RuntimeVariables;
  taskVariables?: RuntimeVariables;
  webhookUrl?: string;
  runId?: string;
}

export interface ExecutionResult<T = unknown> extends UnknownRecord {
  data?: T;
  success?: boolean;
  error?: string;
  runId?: string;
}

export interface Execution<T = unknown> extends UnknownRecord {
  id: string;
  timestamp: number;
  method?: string;
  path?: string;
  status?: string;
  durationMs?: number;
  source?: string;
  mode?: TaskMode | string;
  taskId?: string;
  taskName?: string;
  url?: string;
  result?: T;
}

export interface ScheduleEntry {
  taskId: string;
  taskName: string;
  mode: TaskMode | string;
  schedule: Schedule;
}

export interface Capture {
  name: string;
  url: string;
  size: number;
  modified: number;
  type: "recording" | "screenshot";
}

export interface Credential {
  id: string;
  name: string;
  provider: "baserow";
  config: { baseUrl: string; token: string };
}

export interface CredentialInput {
  name: string;
  provider: "baserow";
  config: { baseUrl: string; token: string };
}

export interface ProxyInput {
  server: string;
  username?: string;
  password?: string;
  label?: string;
  isRotatingPool?: boolean;
  estimatedPoolSize?: number;
}

export interface Proxy extends ProxyInput {
  id: string;
  isDefault?: boolean;
}

export interface ProxyList extends UnknownRecord {
  proxies?: Proxy[];
  rotationMode?: "round-robin" | "random" | string;
  includeDefaultInRotation?: boolean;
}

export interface BrowserSession {
  sessionId: string;
  status: string;
  wsEndpoint?: string;
}

export interface SelectorCandidate {
  css: string;
  xpath?: string;
  confidence?: number;
}

export interface HealthStatus extends UnknownRecord {
  status?: string;
  version?: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: HeadersInit;
}

export interface StreamEvent<T = unknown> {
  data: T;
  event?: string;
  id?: string;
  retry?: number;
  raw: string;
}

export type FigraniumAuth =
  | { apiKey: string; apiKeyHeader?: "authorization" | "x-api-key"; session?: never }
  | { session: true; apiKey?: never; apiKeyHeader?: never }
  | { apiKey?: undefined; session?: false; apiKeyHeader?: never };

export type FigraniumOptions = FigraniumAuth & {
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit;
};
