/**
 * @harchos/sdk v0.3.0 — Retry Logic
 *
 * Exponential backoff with jitter for retryable errors (429, 500, 502, 503).
 * Configurable maxRetries (default: 2).
 */

import { HarchOSError, RateLimitError, isHarchOSError } from './errors.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 2) */
  maxRetries: number;
  /** Initial delay in ms before first retry (default: 1_000) */
  initialDelayMs: number;
  /** Maximum delay cap in ms (default: 30_000) */
  maxDelayMs: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier: number;
  /** Jitter strategy (default: 'full') */
  jitter: 'none' | 'full' | 'decorrelated';
  /** Called before each retry attempt */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_RETRY_CONFIG: Omit<RetryConfig, 'onRetry'> = {
  maxRetries: 2,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  jitter: 'full',
};

// ---------------------------------------------------------------------------
// Retryable Error Classification
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503]);

/**
 * Determine if an error is retryable.
 * Retries on 429, 500, 502, 503 and network-level errors.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true;

  if (isHarchOSError(error) && error.statusCode != null) {
    return RETRYABLE_STATUS_CODES.has(error.statusCode);
  }

  // Generic network / fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Backoff Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate delay for a given attempt with optional jitter.
 */
export function calculateDelay(
  attempt: number,
  config: Pick<RetryConfig, 'initialDelayMs' | 'maxDelayMs' | 'backoffMultiplier' | 'jitter'>,
): number {
  const base = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs,
  );

  switch (config.jitter) {
    case 'none':
      return base;
    case 'full':
      return Math.random() * base;
    case 'decorrelated':
      return config.initialDelayMs + Math.random() * (base * 3 - config.initialDelayMs);
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Sleep Utility
// ---------------------------------------------------------------------------

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

// ---------------------------------------------------------------------------
// Retry Executor
// ---------------------------------------------------------------------------

export interface RetryResult<T> {
  value: T;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Execute an async function with retry logic.
 *
 * @param fn - The function to execute
 * @param config - Retry configuration overrides
 * @param signal - Optional AbortSignal for cancellation
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  signal?: AbortSignal,
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  let attempts = 0;
  let totalDelayMs = 0;
  let lastError: Error = new HarchOSError({ message: 'No attempts made' });

  while (attempts <= fullConfig.maxRetries) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      attempts++;
      const value = await fn();
      return { value, attempts, totalDelayMs };
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(error) || attempts > fullConfig.maxRetries) {
        throw error;
      }

      let delayMs = calculateDelay(attempts - 1, fullConfig);

      // Respect Retry-After header for rate limits
      if (error instanceof RateLimitError && error.retryAfter != null && error.retryAfter > 0) {
        delayMs = Math.max(delayMs, error.retryAfter * 1000);
      }

      totalDelayMs += delayMs;
      fullConfig.onRetry?.(attempts, delayMs, lastError);
      await sleep(delayMs, signal);
    }
  }

  throw lastError;
}
