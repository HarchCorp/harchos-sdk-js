/**
 * HTTP transport layer for the HarchOS SDK.
 *
 * Handles authentication, retries, and error mapping.
 * Uses the native `fetch` API (Node.js 18+).
 */

import { raiseForStatus } from "./errors.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TransportConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  maxRetries: number;
  defaultHeaders?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export class HttpTransport {
  private readonly config: TransportConfig;

  constructor(config: TransportConfig) {
    this.config = config;
  }

  // ------------------------------------------------------------------
  // Public methods
  // ------------------------------------------------------------------

  /** GET request. */
  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = this.buildURL(path, params);
    return this.request<T>("GET", url);
  }

  /** POST request. */
  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("POST", url, body);
  }

  /** PUT request. */
  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("PUT", url, body);
  }

  /** PATCH request. */
  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("PATCH", url, body);
  }

  /** DELETE request. */
  async delete<T = unknown>(path: string): Promise<T> {
    const url = this.buildURL(path);
    return this.request<T>("DELETE", url);
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private buildURL(path: string, params?: Record<string, unknown>): string {
    const base = this.config.baseURL.replace(/\/+$/, "");
    let url = `${base}${path}`;

    if (params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) url += `?${qs}`;
    }

    return url;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": `harchos-sdk-js/0.2.1`,
          ...this.config.defaultHeaders,
        };

        if (this.config.apiKey) {
          headers["Authorization"] = `Bearer ${this.config.apiKey}`;
          headers["X-API-Key"] = this.config.apiKey;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout * 1000,
        );

        const res = await fetch(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Clone the response so we can read headers even on error paths
        const responseHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          responseHeaders[k.toLowerCase()] = v;
        });

        if (!res.ok) {
          let errorBody: string;
          try {
            errorBody = await res.text();
          } catch {
            errorBody = "";
          }

          // Retry on 429 and 5xx (except 401/403)
          const retryable =
            res.status === 429 ||
            (res.status >= 500 && res.status !== 501);

          if (retryable && attempt < this.config.maxRetries) {
            const retryAfter = responseHeaders["retry-after"]
              ? Number(responseHeaders["retry-after"]) * 1000
              : Math.min(1000 * 2 ** attempt, 10_000);
            await sleep(retryAfter);
            continue;
          }

          raiseForStatus(res.status, errorBody || res.statusText, responseHeaders, errorBody);
        }

        // Handle 204 No Content
        if (res.status === 204) {
          return undefined as T;
        }

        return (await res.json()) as T;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "HarchOSError") {
          throw err; // Re-raise our own errors
        }

        lastError = err;

        // Only retry on network errors
        if (attempt < this.config.maxRetries) {
          await sleep(Math.min(1000 * 2 ** attempt, 10_000));
          continue;
        }
      }
    }

    throw lastError;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
