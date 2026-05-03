/**
 * Retry Logic with Exponential Backoff for HarchOS SDK
 *
 * Provides configurable retry with:
 *   - Exponential backoff with jitter
 *   - Retryable error classification
 *   - Per-attempt timeout
 *   - Abort signal support
 */

import {
  HarchOSError,
  NetworkError,
  RateLimitError,
  TimeoutError,
  isHarchOSError,
} from "./errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Initial delay in ms before first retry (default: 1_000) */
  initialDelayMs: number;
  /** Maximum delay cap in ms (default: 30_000) */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Jitter strategy to apply (default: 'full') */
  jitter: "none" | "full" | "decorrelated";
  /** Custom function to decide if an error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Called before each retry attempt */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
  totalDelayMs: number;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_RETRY_CONFIG: Omit<RetryConfig, "isRetryable" | "onRetry"> = {
  maxRetries: 3,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  jitter: "full",
};

// ─── Retryable Error Classification ─────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Determine if an error is retryable based on type and status code.
 */
export function isRetryableError(error: unknown): boolean {
  // Rate limit → retryable (with backoff)
  if (error instanceof RateLimitError) return true;

  // Network errors → retryable
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;

  // HarchOS errors with retryable status codes
  if (isHarchOSError(error) && error.statusCode != null) {
    return RETRYABLE_STATUS_CODES.has(error.statusCode);
  }

  // Generic fetch errors (TypeError from failed fetch)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  return false;
}

// ─── Backoff Calculation ────────────────────────────────────────────────────

/**
 * Calculate delay for a given attempt with optional jitter.
 */
export function calculateDelay(
  attempt: number,
  config: Pick<RetryConfig, "initialDelayMs" | "maxDelayMs" | "backoffMultiplier" | "jitter">,
): number {
  const base = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs,
  );

  switch (config.jitter) {
    case "none":
      return base;

    case "full":
      // Full jitter: random between 0 and base
      return Math.random() * base;

    case "decorrelated":
      // Decorrelated jitter: random between initialDelay and base * 3
      return config.initialDelayMs + Math.random() * (base * 3 - config.initialDelayMs);

    default:
      return base;
  }
}

// ─── Sleep Utility ──────────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

// ─── Retry Executor ─────────────────────────────────────────────────────────

/**
 * Execute an async function with retry logic.
 *
 * @param fn - The function to execute
 * @param config - Retry configuration
 * @param signal - Optional AbortSignal for cancellation
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  signal?: AbortSignal,
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const retryable = fullConfig.isRetryable ?? isRetryableError;

  let attempts = 0;
  let totalDelayMs = 0;
  let lastError: Error = new NetworkError("No attempts made");

  while (attempts <= fullConfig.maxRetries) {
    // Check abort before each attempt
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      attempts++;
      const value = await fn();
      return { value, attempts, totalDelayMs };
    } catch (error) {
      lastError = error as Error;

      // Don't retry if not retryable or out of attempts
      if (!retryable(error) || attempts > fullConfig.maxRetries) {
        throw error;
      }

      // Calculate backoff delay
      const delayMs = calculateDelay(attempts - 1, fullConfig);

      // Special case: rate limit → respect server's retry-after
      if (error instanceof RateLimitError && error.retryAfterMs > 0) {
        const adjustedDelay = Math.max(delayMs, error.retryAfterMs);
        totalDelayMs += adjustedDelay;
        fullConfig.onRetry?.(attempts, adjustedDelay, lastError);
        await sleep(adjustedDelay, signal);
      } else {
        totalDelayMs += delayMs;
        fullConfig.onRetry?.(attempts, delayMs, lastError);
        await sleep(delayMs, signal);
      }
    }
  }

  // Should not reach here, but just in case
  throw lastError;
}

/**
 * Create a pre-configured retry wrapper.
 * Useful for injecting consistent retry behavior.
 */
export function createRetryWrapper(
  config: Partial<RetryConfig>,
): <T>(fn: () => Promise<T>, signal?: AbortSignal) => Promise<RetryResult<T>> {
  return (fn, signal) => withRetry(fn, config, signal);
}
