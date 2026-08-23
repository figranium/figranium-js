import { FigraniumError } from "./error";
import type { FigraniumOptions, RequestOptions, StreamEvent } from "./types";

type QueryValue = string | number | boolean | null | undefined;

interface InternalRequestOptions extends RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
}

export class HttpClient {
  readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly timeoutMs: number;
  private readonly headers: Headers;
  private readonly credentials: RequestCredentials;

  constructor(options: FigraniumOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? "http://localhost:11345");
    this.fetcher = options.fetch ?? globalThis.fetch;
    if (!this.fetcher) throw new TypeError("No fetch implementation is available");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.headers = new Headers(options.headers);
    this.headers.set("accept", "application/json");
    if (options.apiKey) {
      if (options.apiKeyHeader === "x-api-key") this.headers.set("x-api-key", options.apiKey);
      else this.headers.set("authorization", `Bearer ${options.apiKey}`);
    }
    this.credentials = options.session ? "include" : "same-origin";
  }

  async request<T>(method: string, path: string, options: InternalRequestOptions = {}): Promise<T> {
    const url = this.url(path, options.query);
    const headers = new Headers(this.headers);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    const hasBody = options.body !== undefined;
    if (hasBody && !headers.has("content-type")) headers.set("content-type", "application/json");
    const { signal, dispose } = makeSignal(options.signal, options.timeoutMs ?? this.timeoutMs);

    try {
      const response = await this.fetcher(url, {
        method,
        headers,
        credentials: this.credentials,
        signal,
        ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
      });
      if (!response.ok) throw await FigraniumError.fromResponse(response);
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      if (!text) return undefined as T;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("json")) return JSON.parse(text) as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error instanceof FigraniumError) throw error;
      if (signal.aborted) {
        throw new FigraniumError("Figranium request was aborted", {
          code: "REQUEST_ABORTED",
          cause: signal.reason ?? error,
        });
      }
      throw new FigraniumError("Unable to reach the Figranium server", {
        code: "NETWORK_ERROR",
        cause: error,
      });
    } finally {
      dispose();
    }
  }

  stream<T>(path: string, options: RequestOptions = {}): AsyncIterable<StreamEvent<T>> {
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        const headers = new Headers(self.headers);
        headers.set("accept", "text/event-stream");
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
        const { signal, dispose } = makeSignal(options.signal, options.timeoutMs ?? 0);
        try {
          const response = await self.fetcher(self.url(path), {
            method: "GET",
            headers,
            credentials: self.credentials,
            signal,
          });
          if (!response.ok) throw await FigraniumError.fromResponse(response);
          if (!response.body) throw new FigraniumError("Streaming response has no body", { code: "EMPTY_STREAM" });
          yield* parseEventStream<T>(response.body);
        } catch (error) {
          if (error instanceof FigraniumError) throw error;
          if (signal.aborted) {
            throw new FigraniumError("Figranium stream was aborted", {
              code: "REQUEST_ABORTED",
              cause: signal.reason ?? error,
            });
          }
          throw new FigraniumError("Unable to stream from the Figranium server", {
            code: "NETWORK_ERROR",
            cause: error,
          });
        } finally {
          dispose();
        }
      },
    };
  }

  private url(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(path.replace(/^\/+/, ""), `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) throw new TypeError("baseUrl must not be empty");
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl must use http or https");
  }
  return url.toString().replace(/\/+$/, "");
}

function makeSignal(parent: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort(parent?.reason);
  if (parent?.aborted) abort();
  else parent?.addEventListener("abort", abort, { once: true });
  const timer = timeoutMs > 0
    ? setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs)
    : undefined;
  return {
    signal: controller.signal,
    dispose() {
      if (timer !== undefined) clearTimeout(timer);
      parent?.removeEventListener("abort", abort);
    },
  };
}

async function* parseEventStream<T>(stream: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent<T>> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const chunks = buffer.split(/\r?\n\r?\n/);
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const event = parseEvent<T>(chunk);
        if (event) yield event;
      }
      if (done) {
        completed = true;
        break;
      }
    }
    if (buffer.trim()) {
      const event = parseEvent<T>(buffer);
      if (event) yield event;
    }
  } finally {
    if (!completed) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function parseEvent<T>(raw: string): StreamEvent<T> | undefined {
  let event: string | undefined;
  let id: string | undefined;
  let retry: number | undefined;
  const data: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "data") data.push(value);
    else if (field === "event") event = value;
    else if (field === "id") id = value;
    else if (field === "retry" && /^\d+$/.test(value)) retry = Number(value);
  }
  if (!data.length) return undefined;
  const joined = data.join("\n");
  let parsed: unknown = joined;
  try { parsed = JSON.parse(joined); } catch { /* Text SSE payload. */ }
  return {
    data: parsed as T,
    raw: joined,
    ...(event === undefined ? {} : { event }),
    ...(id === undefined ? {} : { id }),
    ...(retry === undefined ? {} : { retry }),
  };
}

export const pathId = (value: string | number): string => encodeURIComponent(String(value));
