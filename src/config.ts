/**
 * @harchos/sdk v0.3.0 — Configuration
 *
 * Central configuration for the HarchOS client.
 * Supports environment variable overrides and sovereign defaults.
 */

export interface ClientConfig {
  /** API base URL */
  baseURL: string;
  /** API key (starts with `hsk_`) */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retry attempts (default: 2) */
  maxRetries: number;
  /** Default region for data residency */
  region: string;
  /** Sovereignty enforcement level */
  sovereignty: 'strict' | 'moderate' | 'minimal';
  /** Enable carbon-aware scheduling by default */
  carbonAware: boolean;
  /** Extra HTTP headers to include with every request */
  defaultHeaders: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_BASE_URL = 'https://api.harchos.ai/v1';
export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_REGION = 'morocco';
export const DEFAULT_SOVEREIGNTY = 'strict' as const;
export const DEFAULT_CARBON_AWARE = true;
export const SDK_VERSION = '0.3.0';

// ---------------------------------------------------------------------------
// Environment Variable Helpers (browser-safe)
// ---------------------------------------------------------------------------

function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function envNumber(key: string, fallback: number): number {
  const val = getEnvVar(key);
  if (val !== undefined) {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function envBoolean(key: string, fallback: boolean): boolean {
  const val = getEnvVar(key)?.toLowerCase();
  if (val == null) return fallback;
  if (val === 'true' || val === '1') return true;
  if (val === 'false' || val === '0') return false;
  return fallback;
}

// ---------------------------------------------------------------------------
// Resolve Config
// ---------------------------------------------------------------------------

export interface ClientOptions {
  /** HarchOS API key (starts with `hsk_`). Falls back to HARCHOS_API_KEY env var. */
  apiKey?: string;
  /** API base URL. Default: `https://api.harchos.ai/v1` */
  baseURL?: string;
  /** Data residency region. Default: `"morocco"` */
  region?: string;
  /** Sovereignty enforcement level. Default: `"strict"` */
  sovereignty?: 'strict' | 'moderate' | 'minimal';
  /** Enable carbon-aware scheduling. Default: `true` */
  carbonAware?: boolean;
  /** Request timeout in milliseconds. Default: `30000` */
  timeout?: number;
  /** Maximum retry attempts. Default: `2` */
  maxRetries?: number;
  /** Extra HTTP headers to send with every request. */
  defaultHeaders?: Record<string, string>;
}

export function resolveConfig(options: ClientOptions = {}): ClientConfig {
  const apiKey = options.apiKey ?? getEnvVar('HARCHOS_API_KEY');
  const baseURL = options.baseURL ?? getEnvVar('HARCHOS_BASE_URL') ?? DEFAULT_BASE_URL;
  const timeout = options.timeout ?? envNumber('HARCHOS_TIMEOUT_MS', DEFAULT_TIMEOUT);
  const maxRetries = options.maxRetries ?? envNumber('HARCHOS_MAX_RETRIES', DEFAULT_MAX_RETRIES);
  const region = options.region ?? getEnvVar('HARCHOS_REGION') ?? DEFAULT_REGION;
  const sovereignty = options.sovereignty ?? (getEnvVar('HARCHOS_SOVEREIGNTY') as ClientConfig['sovereignty']) ?? DEFAULT_SOVEREIGNTY;
  const carbonAware = options.carbonAware ?? envBoolean('HARCHOS_CARBON_AWARE', DEFAULT_CARBON_AWARE);

  return {
    baseURL,
    apiKey,
    timeout,
    maxRetries,
    region,
    sovereignty,
    carbonAware,
    defaultHeaders: options.defaultHeaders ?? {},
  };
}
