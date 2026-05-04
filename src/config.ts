/**
 * HarchOS SDK Configuration Management
 *
 * Supports named profiles, environment variable overrides,
 * and sovereign defaults (region="morocco", sovereignty="strict").
 */

import {
  createSovereignConfig,
  type SovereignConfig,
  type SovereignConfigInput,
} from "./types/sovereignty.js";
import { ConfigurationError, MissingProfileError } from "./errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ClientConfig {
  /** Base URL for the HarchOS API */
  baseUrl: string;
  /** API version prefix, e.g. "v1" */
  apiVersion: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Maximum number of retries for transient failures */
  maxRetries: number;
  /** Sovereign policy configuration */
  sovereign: SovereignConfig;
  /** Custom headers to include in every request */
  defaultHeaders: Record<string, string>;
  /** User-Agent suffix */
  userAgent: string;
}

export interface ProfileConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeoutMs?: number;
  maxRetries?: number;
  sovereign?: SovereignConfigInput;
  defaultHeaders?: Record<string, string>;
  apiKey?: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://api.harchos.com";
const DEFAULT_API_VERSION = "v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_USER_AGENT = "@harchos/sdk/0.1.0";

// ─── Browser-safe env access ────────────────────────────────────────────────

function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

// ─── Environment Variable Mapping ───────────────────────────────────────────

function envString(key: string): string | undefined {
  return getEnvVar(key) ?? undefined;
}

function envNumber(key: string): number | undefined {
  const raw = getEnvVar(key);
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function envBoolean(key: string): boolean | undefined {
  const raw = getEnvVar(key)?.toLowerCase();
  if (raw == null) return undefined;
  return raw === "true" || raw === "1" ? true : raw === "false" || raw === "0" ? false : undefined;
}

// ─── Profile Registry ───────────────────────────────────────────────────────

const profiles = new Map<string, ProfileConfig>();

/**
 * Register a named configuration profile.
 * Profiles are shallow-merged with defaults at resolve time.
 */
export function registerProfile(name: string, config: ProfileConfig): void {
  if (profiles.has(name)) {
    throw new ConfigurationError(`Profile "${name}" is already registered. Use updateProfile() to modify.`);
  }
  profiles.set(name, Object.freeze({ ...config }));
}

/**
 * Update an existing named configuration profile.
 */
export function updateProfile(name: string, config: Partial<ProfileConfig>): void {
  const existing = profiles.get(name);
  if (!existing) {
    throw new MissingProfileError(name);
  }
  profiles.set(name, Object.freeze({ ...existing, ...config }));
}

/**
 * Get a registered profile by name.
 */
export function getProfile(name: string): ProfileConfig {
  const profile = profiles.get(name);
  if (!profile) {
    throw new MissingProfileError(name);
  }
  return profile;
}

/**
 * List all registered profile names.
 */
export function listProfiles(): string[] {
  return [...profiles.keys()];
}

// ─── Resolve Full Config ────────────────────────────────────────────────────

export interface ResolveConfigOptions {
  /** Named profile to load (overrides env + defaults) */
  profile?: string;
  /** Explicit overrides (highest priority) */
  overrides?: Partial<ProfileConfig>;
}

/**
 * Resolve a complete `ClientConfig` by merging:
 *   defaults → profile → environment variables → overrides
 */
export function resolveConfig(opts?: ResolveConfigOptions): ClientConfig {
  // 1. Start with profile if provided
  const profile = opts?.profile ? getProfile(opts.profile) : {};
  const overrides = opts?.overrides ?? {};

  // 2. Merge: defaults → profile → env → overrides
  const baseUrl =
    overrides.baseUrl
    ?? envString("HARCHOS_BASE_URL")
    ?? profile.baseUrl
    ?? DEFAULT_BASE_URL;

  const apiVersion =
    overrides.apiVersion
    ?? envString("HARCHOS_API_VERSION")
    ?? profile.apiVersion
    ?? DEFAULT_API_VERSION;

  const timeoutMs =
    overrides.timeoutMs
    ?? envNumber("HARCHOS_TIMEOUT_MS")
    ?? profile.timeoutMs
    ?? DEFAULT_TIMEOUT_MS;

  const maxRetries =
    overrides.maxRetries
    ?? envNumber("HARCHOS_MAX_RETRIES")
    ?? profile.maxRetries
    ?? DEFAULT_MAX_RETRIES;

  const defaultHeaders = {
    ...profile.defaultHeaders,
    ...overrides.defaultHeaders,
  };

  // 3. Resolve sovereign config
  const sovereignInput: SovereignConfigInput = {
    region: overrides.sovereign?.region
      ?? envString("HARCHOS_REGION")
      ?? profile.sovereign?.region,
    sovereignty: overrides.sovereign?.sovereignty
      ?? envString("HARCHOS_SOVEREIGNTY")
      ?? profile.sovereign?.sovereignty,
    carbonAware: overrides.sovereign?.carbonAware
      ?? envBoolean("HARCHOS_CARBON_AWARE")
      ?? profile.sovereign?.carbonAware,
    dataResidency: overrides.sovereign?.dataResidency
      ?? (envString("HARCHOS_DATA_RESIDENCY") as "local" | "regional" | undefined)
      ?? profile.sovereign?.dataResidency,
    encryptionAtRest: overrides.sovereign?.encryptionAtRest
      ?? envBoolean("HARCHOS_ENCRYPTION_AT_REST")
      ?? profile.sovereign?.encryptionAtRest,
    auditLogging: overrides.sovereign?.auditLogging
      ?? envBoolean("HARCHOS_AUDIT_LOGGING")
      ?? profile.sovereign?.auditLogging,
  };

  const sovereign = createSovereignConfig(sovereignInput);

  // 4. Validate
  if (timeoutMs < 1_000) {
    throw new ConfigurationError(`timeoutMs must be >= 1000, got ${timeoutMs}`);
  }
  if (maxRetries < 0 || maxRetries > 10) {
    throw new ConfigurationError(`maxRetries must be between 0 and 10, got ${maxRetries}`);
  }

  return Object.freeze({
    baseUrl,
    apiVersion,
    timeoutMs,
    maxRetries,
    sovereign,
    defaultHeaders,
    userAgent: DEFAULT_USER_AGENT,
  });
}

// ─── Default Profile Registration ───────────────────────────────────────────

/**
 * Register the "default" profile with sovereign defaults.
 * Called automatically — safe to call multiple times (idempotent check).
 */
export function registerDefaultProfile(): void {
  if (!profiles.has("default")) {
    registerProfile("default", {});
  }
}

// Auto-register default profile on import
registerDefaultProfile();
