import type { UnknownRecord } from "./types";

export class FigraniumError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly response?: Response;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      requestId?: string;
      response?: Response;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "FigraniumError";
    this.status = options.status ?? 0;
    if (options.code !== undefined) this.code = options.code;
    if (options.details !== undefined) this.details = options.details;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    if (options.response !== undefined) this.response = options.response;
  }

  static async fromResponse(response: Response): Promise<FigraniumError> {
    const requestId = response.headers.get("x-request-id") ?? undefined;
    const raw = await response.text().catch(() => "");
    let body: UnknownRecord | undefined;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : undefined;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as UnknownRecord;
    } catch {
      // The response was not JSON; use the raw text as the diagnostic message.
    }
    const code = typeof body?.error === "string" ? body.error : undefined;
    const detail = body?.details ?? body?.detail;
    const serverMessage = typeof body?.message === "string" ? body.message : undefined;
    const message = serverMessage ?? code ?? (raw || `Figranium request failed with status ${response.status}`);
    return new FigraniumError(message, {
      status: response.status,
      ...(code === undefined ? {} : { code }),
      ...(detail === undefined ? {} : { details: detail }),
      ...(requestId === undefined ? {} : { requestId }),
      response,
    });
  }
}
