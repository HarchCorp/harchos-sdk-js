/**
 * @harchos/sdk v0.3.0 — Main Client
 *
 * The primary entry point for interacting with the HarchOS API.
 * Provides sovereign defaults: region="morocco", sovereignty="strict", carbon_aware=true.
 *
 * @example
 * ```ts
 * import HarchOS from '@harchos/sdk';
 *
 * const client = new HarchOS({ apiKey: 'hsk_...' });
 *
 * // Inference — OpenAI-compatible
 * const completion = await client.inference.chat.completions.create({
 *   model: 'harchos-llama-3.3-70b',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   carbon_aware: true,
 * });
 *
 * // Streaming
 * const stream = await client.inference.chat.completions.create({
 *   model: 'harchos-llama-3.3-70b',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   stream: true,
 * });
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
 * }
 *
 * // Carbon tracking
 * const intensity = await client.carbon.intensity('MA');
 * const optimal = await client.carbon.optimalHub({ region: 'morocco', gpu_count: 4 });
 *
 * // Workloads
 * const workload = await client.workloads.create({ name: 'test', type: 'training', compute: { gpu_count: 4 } });
 * const workloads = await client.workloads.list();
 *
 * // Hubs
 * const hubs = await client.hubs.list();
 * ```
 */

import { resolveConfig, type ClientOptions, type ClientConfig, SDK_VERSION } from './config.js';

// Re-export ClientOptions for consumers
export type { ClientOptions } from './config.js';
import { raiseForStatus, TimeoutError, ConnectionError, isHarchOSError } from './errors.js';
import { isRetryableError, calculateDelay, type RetryConfig } from './retry.js';
import type { Transport } from './resources/inference.js';
import type { HealthStatus } from './types.js';

import { InferenceResource } from './resources/inference.js';
import { WorkloadsResource } from './resources/workloads.js';
import { HubsResource } from './resources/hubs.js';
import { CarbonResource } from './resources/carbon.js';
import { PricingResource } from './resources/pricing.js';
import { AuthResource } from './resources/auth.js';

// ---------------------------------------------------------------------------
// HTTP Transport (built into the client)
// ---------------------------------------------------------------------------

class HttpTransport implements Transport {
  private readonly config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { stream?: boolean; headers?: Record<string, string> },
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(method, path, body, opts?.headers);

        // For streaming requests, return the raw Response — the caller handles it
        if (opts?.stream) {
          return response as unknown as T;
        }

        const responseHeaders = this.extractHeaders(response);

        if (!response.ok) {
          let errorBody: string;
          try {
            errorBody = await response.text();
          } catch {
            errorBody = '';
          }

          // Retry on 429, 500, 502, 503
          const retryable = response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503;

          if (retryable && attempt < this.config.maxRetries) {
            const delayMs = this.getRetryDelay(attempt, responseHeaders);
            await sleep(delayMs);
            continue;
          }

          raiseForStatus(response.status, errorBody || response.statusText, responseHeaders, errorBody);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (err: unknown) {
        if (isHarchOSError(err)) {
          throw err;
        }

        lastError = err;

        // Only retry on network errors
        if (attempt < this.config.maxRetries && isRetryableNetworkError(err)) {
          const delayMs = this.getRetryDelay(attempt);
          await sleep(delayMs);
          continue;
        }

        // Convert known errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new TimeoutError('Request timed out');
        }

        if (err instanceof TypeError && err.message.includes('fetch')) {
          throw new ConnectionError(err.message);
        }
      }
    }

    throw lastError;
  }

  async rawRequest(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<Response> {
    // For streaming, we need the raw Response object
    // We still apply retry logic but return the Response directly
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(method, path, body, headers);

        if (!response.ok) {
          const responseHeaders = this.extractHeaders(response);
          let errorBody: string;
          try {
            errorBody = await response.text();
          } catch {
            errorBody = '';
          }

          const retryable = response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503;

          if (retryable && attempt < this.config.maxRetries) {
            const delayMs = this.getRetryDelay(attempt, responseHeaders);
            await sleep(delayMs);
            continue;
          }

          raiseForStatus(response.status, errorBody || response.statusText, responseHeaders, errorBody);
        }

        return response;
      } catch (err: unknown) {
        if (isHarchOSError(err)) {
          throw err;
        }

        lastError = err;

        if (attempt < this.config.maxRetries && isRetryableNetworkError(err)) {
          const delayMs = this.getRetryDelay(attempt);
          await sleep(delayMs);
          continue;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new TimeoutError('Request timed out');
        }

        if (err instanceof TypeError && err.message.includes('fetch')) {
          throw new ConnectionError(err.message);
        }
      }
    }

    throw lastError;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async makeRequest(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<Response> {
    const url = this.buildURL(path);
    const headers = this.buildHeaders(extraHeaders);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout,
    );

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildURL(path: string, params?: Record<string, unknown>): string {
    const base = this.config.baseURL.replace(/\/+$/, '');
    let url = `${base}${path}`;

    if (params) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }

    return url;
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `harchos-sdk-js/${SDK_VERSION}`,
      'X-HarchOS-Region': this.config.region,
      'X-HarchOS-Sovereignty': this.config.sovereignty,
      'X-HarchOS-Carbon-Aware': String(this.config.carbonAware),
      ...this.config.defaultHeaders,
      ...extra,
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  private extractHeaders(response: Response): Record<string, string> {
    const result: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      result[k.toLowerCase()] = v;
    });
    return result;
  }

  private getRetryDelay(attempt: number, headers?: Record<string, string>): number {
    // Respect Retry-After header
    if (headers?.['retry-after']) {
      const retryAfter = Number(headers['retry-after']) * 1000;
      if (Number.isFinite(retryAfter)) return retryAfter;
    }

    // Exponential backoff with full jitter
    return calculateDelay(attempt, {
      initialDelayMs: 1_000,
      maxDelayMs: 30_000,
      backoffMultiplier: 2,
      jitter: 'full',
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes('fetch')) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return false; // Don't retry timeouts
  return false;
}

// ---------------------------------------------------------------------------
// Main Client Class
// ---------------------------------------------------------------------------

export class HarchOS {
  private readonly transport: HttpTransport;
  private readonly _config: ClientConfig;

  /** OpenAI-compatible inference with carbon tracking. */
  readonly inference: InferenceResource;

  /** Carbon-aware scheduling and tracking — HarchOS's unique differentiator. */
  readonly carbon: CarbonResource;

  /** Sovereign compute hub management. */
  readonly hubs: HubsResource;

  /** Workload lifecycle management. */
  readonly workloads: WorkloadsResource;

  /** Pricing and cost estimation. */
  readonly pricing: PricingResource;

  /** Authentication and API key management. */
  readonly auth: AuthResource;

  constructor(options: ClientOptions = {}) {
    this._config = resolveConfig(options);
    this.transport = new HttpTransport(this._config);

    // Initialize resources
    this.inference = new InferenceResource(this.transport);
    this.carbon = new CarbonResource(this.transport);
    this.hubs = new HubsResource(this.transport);
    this.workloads = new WorkloadsResource(this.transport);
    this.pricing = new PricingResource(this.transport);
    this.auth = new AuthResource(this.transport);
  }

  // ------------------------------------------------------------------
  // Accessors
  // ------------------------------------------------------------------

  /** The configured data residency region. */
  get region(): string {
    return this._config.region;
  }

  /** The sovereignty enforcement level. */
  get sovereignty(): string {
    return this._config.sovereignty;
  }

  /** Whether carbon-aware scheduling is enabled. */
  get carbonAware(): boolean {
    return this._config.carbonAware;
  }

  /** The resolved API base URL. */
  get baseURL(): string {
    return this._config.baseURL;
  }

  // ------------------------------------------------------------------
  // Health check
  // ------------------------------------------------------------------

  /** Check the health of the HarchOS API. */
  async health(): Promise<HealthStatus> {
    return this.transport.request<HealthStatus>('GET', '/health');
  }

  // ------------------------------------------------------------------
  // Factory
  // ------------------------------------------------------------------

  /** Create a client configured from environment variables. */
  static fromEnv(overrides?: ClientOptions): HarchOS {
    return new HarchOS(overrides);
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default HarchOS;
