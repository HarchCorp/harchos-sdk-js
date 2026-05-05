/**
 * HarchOS Client — Main SDK Entry Point
 *
 * The HarchOSClient orchestrates authentication, retry, circuit-breaking,
 * and sovereignty enforcement for all API interactions.
 */

import { AuthManager, type AuthProvider, apiKeyAuth } from "./auth.js";
import { type ClientConfig, resolveConfig, type ResolveConfigOptions } from "./config.js";
import { CircuitBreaker, createCircuitBreaker, type CircuitBreakerConfig } from "./circuit-breaker.js";
import { withRetry, type RetryConfig } from "./retry.js";
import {
  HarchOSError,
  NetworkError,
  RateLimitError,
  TimeoutError,
  SovereigntyViolationError,
} from "./errors.js";
import { WorkloadsResource } from "./resources/workloads.js";
import { ModelsResource } from "./resources/models.js";
import { HubsResource } from "./resources/hubs.js";
import { EnergyResource } from "./resources/energy.js";
import { PricingResource } from "./resources/pricing.js";
import { RegionsResource } from "./resources/regions.js";
import { MonitoringResource } from "./resources/monitoring.js";
import type { RequestOptions, ApiErrorResponse, ApiResult } from "./types/index.js";
import type { SovereignRegion } from "./types/sovereignty.js";

// ─── HTTP Client Interface ──────────────────────────────────────────────────

export interface HttpRequestOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Record<string, any>;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

export interface HttpClient {
  get<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T>;
  post<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T>;
  patch<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T>;
  put<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T>;
  delete<T = void>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T>;
}

// ─── Client Options ─────────────────────────────────────────────────────────

export interface HarchOSClientOptions {
  /** API key (shorthand for API key auth) */
  apiKey?: string;
  /** Auth provider (for OAuth2) */
  auth?: AuthProvider;
  /** Configuration profile name */
  profile?: string;
  /** Configuration overrides */
  config?: ResolveConfigOptions["overrides"];
  /** Custom retry configuration */
  retry?: Partial<RetryConfig>;
  /** Custom circuit breaker configuration */
  circuitBreaker?: Partial<CircuitBreakerConfig>;
}

// ─── HarchOS Client ─────────────────────────────────────────────────────────

export class HarchOSClient implements HttpClient {
  public readonly config: ClientConfig;
  public readonly auth: AuthManager;
  public readonly circuitBreaker: CircuitBreaker;

  public readonly workloads: WorkloadsResource;
  public readonly models: ModelsResource;
  public readonly hubs: HubsResource;
  public readonly energy: EnergyResource;
  public readonly pricing: PricingResource;
  public readonly regions: RegionsResource;
  public readonly monitoring: MonitoringResource;

  private retryConfig: Partial<RetryConfig>;

  constructor(options?: HarchOSClientOptions) {
    // 1. Resolve configuration
    this.config = resolveConfig({
      profile: options?.profile,
      overrides: options?.config,
    });

    // 2. Set up authentication
    const provider = options?.auth ?? (options?.apiKey ? apiKeyAuth(options.apiKey) : apiKeyAuth());
    this.auth = new AuthManager(provider);

    // 3. Circuit breaker
    this.circuitBreaker = createCircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30_000,
      ...options?.circuitBreaker,
    });

    // 4. Retry config
    this.retryConfig = {
      maxRetries: this.config.maxRetries,
      ...options?.retry,
    };

    // 5. Resource modules
    this.workloads = new WorkloadsResource(this);
    this.models = new ModelsResource(this);
    this.hubs = new HubsResource(this);
    this.energy = new EnergyResource(this);
    this.pricing = new PricingResource(this);
    this.regions = new RegionsResource(this);
    this.monitoring = new MonitoringResource(this);
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────

  async get<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T> {
    return this.request<T>("GET", path, opts);
  }

  async post<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T> {
    return this.request<T>("POST", path, opts);
  }

  async patch<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T> {
    return this.request<T>("PATCH", path, opts);
  }

  async put<T>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T> {
    return this.request<T>("PUT", path, opts);
  }

  async delete<T = void>(path: string, opts?: HttpRequestOptions | RequestOptions): Promise<T> {
    return this.request<T>("DELETE", path, opts);
  }

  // ─── Core Request ─────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    opts?: HttpRequestOptions | RequestOptions,
  ): Promise<T> {
    const httpOpts = this.normalizeOptions(opts);

    return this.circuitBreaker.execute(async () => {
      const result = await withRetry(
        async () => {
          const response = await this.rawRequest(method, path, httpOpts);
          return this.processResponse<T>(response, httpOpts);
        },
        {
          ...this.retryConfig,
          maxRetries: httpOpts.maxRetries ?? this.retryConfig.maxRetries,
        },
        httpOpts.signal,
      );
      return result.value;
    });
  }

  private async rawRequest(
    method: string,
    path: string,
    opts: HttpRequestOptions,
  ): Promise<Response> {
    const url = this.buildUrl(path, opts.query);
    const headers = await this.buildHeaders(opts);

    const controller = new AbortController();
    const timeoutMs = opts.timeoutMs ?? this.config.timeoutMs;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // Merge abort signals
    if (opts.signal) {
      opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: opts.body != null ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TimeoutError(timeoutMs);
      }
      throw new NetworkError((error as Error).message, { cause: error as Error });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async processResponse<T>(
    response: Response,
    _opts: HttpRequestOptions,
  ): Promise<T> {
    const requestId = response.headers.get("x-request-id") ?? undefined;

    // Rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5_000;
      throw new RateLimitError(retryAfterMs, { requestId });
    }

    // Read body
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    // Error handling
    if (!response.ok) {
      this.handleErrorResponse(response.status, body, requestId);
    }

    // Success: unwrap the API response envelope
    if (body && typeof body === "object" && "success" in (body as Record<string, unknown>)) {
      const result = body as ApiResult<T>;
      if (result.success) {
        // Sovereignty enforcement: check region in metadata
        if (result.meta?.region) {
          this.enforceSovereignty(result.meta.region as unknown as SovereignRegion);
        }
        return result.data;
      }
      // Should not reach here for 2xx, but handle gracefully
      throw new HarchOSError({
        message: (result as ApiErrorResponse).error.message,
        code: "UNKNOWN",
        statusCode: response.status,
        requestId,
      });
    }

    // Non-enveloped response (backward compat)
    return body as T;
  }

  private handleErrorResponse(
    status: number,
    body: unknown,
    requestId?: string,
  ): never {
    const errorData =
      body && typeof body === "object" && "error" in (body as Record<string, unknown>)
        ? (body as ApiErrorResponse).error
        : null;

    const message = errorData?.message ?? `HTTP ${status}`;
    const code = errorData?.code ?? "UNKNOWN";

    throw new HarchOSError({
      message,
      code: code as HarchOSError["code"],
      statusCode: status,
      requestId,
    });
  }

  // ─── Sovereignty Enforcement ──────────────────────────────────────────

  private enforceSovereignty(responseRegion: SovereignRegion): void {
    const config = this.config.sovereign;

    if (config.sovereignty === "strict" || config.sovereignty === "moderate") {
      if (responseRegion !== config.region) {
        throw new SovereigntyViolationError(
          `Response served from region "${responseRegion}" but sovereignty policy requires "${config.region}"`,
          "region_mismatch",
        );
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildUrl(path: string, query?: Record<string, any>): string {
    const base = `${this.config.baseUrl}/${this.config.apiVersion}`;
    const url = new URL(path, base);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async buildHeaders(opts: HttpRequestOptions): Promise<Record<string, string>> {
    const authHeaders = await this.auth.authHeaders();

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": this.config.userAgent,
      ...this.config.defaultHeaders,
      ...authHeaders,
      ...opts.headers,
      ...(opts.idempotencyKey
        ? { "Idempotency-Key": opts.idempotencyKey }
        : {}),
    };
  }

  private normalizeOptions(
    opts?: HttpRequestOptions | RequestOptions,
  ): HttpRequestOptions {
    if (!opts) return {};

    // RequestOptions has signal, timeoutMs, maxRetries — map to HttpRequestOptions
    if ("signal" in opts || "timeoutMs" in opts || "maxRetries" in opts) {
      const ro = opts as RequestOptions;
      return {
        signal: ro.signal,
        timeoutMs: ro.timeoutMs,
        maxRetries: ro.maxRetries,
        headers: ro.headers,
        idempotencyKey: ro.idempotencyKey,
      };
    }

    return opts as HttpRequestOptions;
  }

  // ─── Convenience ──────────────────────────────────────────────────────

  /** Check the health of the HarchOS API */
  async health(): Promise<{ status: string; version: string }> {
    return this.get("/health");
  }

  /** Get the current authenticated user/org info */
  async me(): Promise<{ id: string; name: string; org: string }> {
    return this.get("/me");
  }
}
