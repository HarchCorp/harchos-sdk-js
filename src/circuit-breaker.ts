/**
 * Circuit Breaker Pattern for HarchOS SDK
 *
 * Implements the three-state circuit breaker (Closed → Open → Half-Open)
 * to prevent cascading failures when downstream services are unhealthy.
 *
 * States:
 *   - CLOSED:  Requests flow normally. Failures increment the counter.
 *              When failures exceed `failureThreshold`, transitions to OPEN.
 *   - OPEN:    All requests fail immediately with CircuitOpenError.
 *              After `resetTimeoutMs`, transitions to HALF_OPEN.
 *   - HALF_OPEN: A single probe request is allowed.
 *              If it succeeds → CLOSED (reset failures).
 *              If it fails → OPEN (restart timer).
 */

import { CircuitOpenError } from "./errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting half-open (default: 30_000) */
  resetTimeoutMs: number;
  /** Time in ms for the success window to reset failure count (default: 60_000) */
  successWindowMs: number;
  /** Called on state transitions */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  /** Called on every failure */
  onFailure?: (error: Error, state: CircuitState) => void;
  /** Called on every success */
  onSuccess?: (state: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: Date | null;
  lastSuccessAt: Date | null;
  openedAt: Date | null;
  totalTrips: number;
}

// ─── Implementation ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, "onStateChange" | "onFailure" | "onSuccess"> = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successWindowMs: 60_000,
};

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private openedAt: Date | null = null;
  private totalTrips = 0;
  private halfOpenProbe: Promise<unknown> | null = null;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Current circuit state */
  get currentState(): CircuitState {
    if (this.state === "open") {
      // Check if we should transition to half-open
      if (this.openedAt && Date.now() - this.openedAt.getTime() >= this.config.resetTimeoutMs) {
        this.transition("half_open");
      }
    }
    return this.state;
  }

  /** Snapshot of circuit statistics */
  get stats(): CircuitBreakerStats {
    return {
      state: this.currentState,
      failures: this.failures,
      successes: this.successes,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      openedAt: this.openedAt,
      totalTrips: this.totalTrips,
    };
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitOpenError if the circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;

    if (state === "open") {
      throw new CircuitOpenError(this.openedAt ?? new Date());
    }

    if (state === "half_open") {
      // Only allow one probe at a time
      if (this.halfOpenProbe) {
        throw new CircuitOpenError(this.openedAt ?? new Date());
      }

      try {
        this.halfOpenProbe = fn();
        const result = await this.halfOpenProbe as T;
        this.recordSuccess();
        return result;
      } catch (error) {
        this.recordFailure(error as Error);
        throw error;
      } finally {
        this.halfOpenProbe = null;
      }
    }

    // Closed state — normal execution
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  /** Manually reset the circuit to closed state */
  reset(): void {
    this.failures = 0;
    this.transition("closed");
  }

  /** Manually trip the circuit to open state */
  trip(): void {
    this.transition("open");
    this.openedAt = new Date();
    this.totalTrips++;
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private recordSuccess(): void {
    this.successes++;
    this.lastSuccessAt = new Date();

    if (this.state === "half_open") {
      // Probe succeeded → close circuit
      this.failures = 0;
      this.transition("closed");
    }

    // In closed state, reset failure count after a success window
    if (
      this.state === "closed" &&
      this.lastFailureAt &&
      Date.now() - this.lastFailureAt.getTime() > this.config.successWindowMs
    ) {
      this.failures = 0;
    }

    this.config.onSuccess?.(this.state);
  }

  private recordFailure(error: Error): void {
    this.failures++;
    this.lastFailureAt = new Date();

    this.config.onFailure?.(error, this.state);

    if (this.state === "half_open") {
      // Probe failed → re-open
      this.transition("open");
      this.openedAt = new Date();
      this.totalTrips++;
      return;
    }

    if (this.state === "closed" && this.failures >= this.config.failureThreshold) {
      this.transition("open");
      this.openedAt = new Date();
      this.totalTrips++;
    }
  }

  private transition(to: CircuitState): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    this.config.onStateChange?.(from, to);
  }
}

/**
 * Create a circuit breaker with optional configuration.
 */
export function createCircuitBreaker(
  config?: Partial<CircuitBreakerConfig>,
): CircuitBreaker {
  return new CircuitBreaker(config);
}
