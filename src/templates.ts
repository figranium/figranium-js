import { HttpClient, pathId } from "./http";
import type { RequestOptions, UnknownRecord } from "./types";

/** v0.20 template catalog. Import tracking is separate from saving a task. */
export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}
  /** With no filters, the server returns the legacy unpaginated array. */
  list(options?: RequestOptions): Promise<UnknownRecord[]> {
    return this.http.request("GET", "/api/templates", options);
  }
  search(query: { limit?: number; offset?: number; sort?: "popular" | "newest" | "name"; category?: string; search?: string } = {}, options?: RequestOptions): Promise<{ items: UnknownRecord[]; total: number }> {
    return this.http.request("GET", "/api/templates", { ...options, query: { limit: query.limit ?? 12, offset: query.offset, sort: query.sort, category: query.category, search: query.search } });
  }
  get(id: string, options?: RequestOptions): Promise<UnknownRecord> {
    return this.http.request("GET", `/api/templates/${pathId(id)}`, options);
  }
  /** Call only after a successful local task import. Each installation is counted once per template. */
  recordImport(id: string, options?: RequestOptions): Promise<UnknownRecord> {
    return this.http.request("POST", `/api/templates/${pathId(id)}/import`, options);
  }
}
