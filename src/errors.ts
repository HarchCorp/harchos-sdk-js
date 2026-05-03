/**
 * HarchOS SDK Error Hierarchy
 *
 * All SDK errors extend HarchOSError. Discriminated via `.code` for
 * programmatic switch/case handling.
 */

/** Discriminator for all HarchOS error codes */
export type HarchOSErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_FORBIDDEN"
  | "CONFIG_INVALID"
  | "CONFIG_MISSING_PROFILE"
  | "NETWORK_ERROR"
  | "NETWORK_TIMEOUT"
  | "NETWORK_DNS"
  | "RATE_LIMITED"
  | "CIRCUIT_OPEN"
  | "SOVEREIGNTY_VIOLATION"
  | "SOVEREIGNTY_REGION_MISMATCH"
  | "SOVEREIGNTY_DATA_RESIDENCY"
  | "WORKLOAD_NOT_FOUND"
  | "WORKLOAD_CONFLICT"
  | "MODEL_NOT_FOUND"
  | "HUB_NOT_FOUND"
  | "ENERGY_INSUFFICIENT"
  | "STREAM_DISCONNECTED"
  | "UNKNOWN";

/**
 * Base error class for all HarchOS SDK errors.
 * Uses discriminated union pattern via `code` field.
 */
export class HarchOSError extends Error {
  public readonly code: HarchOSErrorCode;
  public readonly statusCode?: number;
  public readonly requestId?: string;
  public readonly timestamp: Date;

  constructor(options: {
    message: string;
    code: HarchOSErrorCode;
    statusCode?: number;
    requestId?: string;
    cause?: Error;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "HarchOSError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;
    this.timestamp = new Date();

    // Restore prototype chain (extends Error breaks it in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Serialize to a plain object for logging / JSON transport */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      requestId: this.requestId,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// ─── Authentication Errors ──────────────────────────────────────────────────

export class AuthenticationError extends HarchOSError {
  constructor(
    message = "Authentication failed",
    opts?: { statusCode?: number; requestId?: string; cause?: Error },
  ) {
    super({ message, code: "AUTH_INVALID_CREDENTIALS", ...opts });
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TokenExpiredError extends HarchOSError {
  public readonly expiresAt: Date;

  constructor(
    expiresAt: Date,
    opts?: { requestId?: string; cause?: Error },
  ) {
    super({
      message: `Token expired at ${expiresAt.toISOString()}`,
      code: "AUTH_TOKEN_EXPIRED",
      statusCode: 401,
      ...opts,
    });
    this.name = "TokenExpiredError";
    this.expiresAt = expiresAt;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ForbiddenError extends HarchOSError {
  public readonly requiredRole?: string;

  constructor(
    message = "Access forbidden",
    opts?: { requiredRole?: string; requestId?: string; cause?: Error },
  ) {
    super({ message, code: "AUTH_FORBIDDEN", statusCode: 403, ...opts });
    this.name = "ForbiddenError";
    this.requiredRole = opts?.requiredRole;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Configuration Errors ───────────────────────────────────────────────────

export class ConfigurationError extends HarchOSError {
  constructor(message: string, opts?: { cause?: Error }) {
    super({ message, code: "CONFIG_INVALID", ...opts });
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MissingProfileError extends HarchOSError {
  public readonly profileName: string;

  constructor(profileName: string, opts?: { cause?: Error }) {
    super({
      message: `Configuration profile "${profileName}" not found`,
      code: "CONFIG_MISSING_PROFILE",
      ...opts,
    });
    this.name = "MissingProfileError";
    this.profileName = profileName;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Network Errors ─────────────────────────────────────────────────────────

export class NetworkError extends HarchOSError {
  constructor(
    message = "Network request failed",
    opts?: { statusCode?: number; requestId?: string; cause?: Error },
  ) {
    super({ message, code: "NETWORK_ERROR", ...opts });
    this.name = "NetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends HarchOSError {
  public readonly timeoutMs: number;

  constructor(
    timeoutMs: number,
    opts?: { requestId?: string; cause?: Error },
  ) {
    super({
      message: `Request timed out after ${timeoutMs}ms`,
      code: "NETWORK_TIMEOUT",
      ...opts,
    });
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitError extends HarchOSError {
  public readonly retryAfterMs: number;

  constructor(
    retryAfterMs: number,
    opts?: { requestId?: string; cause?: Error },
  ) {
    super({
      message: `Rate limited — retry after ${retryAfterMs}ms`,
      code: "RATE_LIMITED",
      statusCode: 429,
      ...opts,
    });
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Circuit Breaker Errors ─────────────────────────────────────────────────

export class CircuitOpenError extends HarchOSError {
  public readonly opensAt: Date;

  constructor(
    opensAt: Date,
    opts?: { cause?: Error },
  ) {
    super({
      message: `Circuit breaker is open since ${opensAt.toISOString()}`,
      code: "CIRCUIT_OPEN",
      ...opts,
    });
    this.name = "CircuitOpenError";
    this.opensAt = opensAt;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Sovereignty Errors ─────────────────────────────────────────────────────

export class SovereigntyViolationError extends HarchOSError {
  public readonly violation: "region_mismatch" | "data_residency" | "policy";

  constructor(
    message: string,
    violation: "region_mismatch" | "data_residency" | "policy",
    opts?: { cause?: Error },
  ) {
    const code =
      violation === "region_mismatch"
        ? "SOVEREIGNTY_REGION_MISMATCH"
        : violation === "data_residency"
          ? "SOVEREIGNTY_DATA_RESIDENCY"
          : "SOVEREIGNTY_VIOLATION";

    super({ message, code, ...opts });
    this.name = "SovereigntyViolationError";
    this.violation = violation;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Resource Errors ────────────────────────────────────────────────────────

export class ResourceNotFoundError extends HarchOSError {
  public readonly resource: string;
  public readonly id: string;

  constructor(resource: string, id: string, opts?: { requestId?: string; cause?: Error }) {
    super({
      message: `${resource} "${id}" not found`,
      code: resource === "Workload" ? "WORKLOAD_NOT_FOUND"
        : resource === "Model" ? "MODEL_NOT_FOUND"
        : "HUB_NOT_FOUND",
      statusCode: 404,
      ...opts,
    });
    this.name = "ResourceNotFoundError";
    this.resource = resource;
    this.id = id;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WorkloadConflictError extends HarchOSError {
  constructor(
    message = "Workload already exists with the same identifier",
    opts?: { requestId?: string; cause?: Error },
  ) {
    super({ message, code: "WORKLOAD_CONFLICT", statusCode: 409, ...opts });
    this.name = "WorkloadConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EnergyInsufficientError extends HarchOSError {
  public readonly requested: number;
  public readonly available: number;

  constructor(requested: number, available: number, opts?: { cause?: Error }) {
    super({
      message: `Insufficient energy: requested ${requested}kWh but only ${available}kWh available`,
      code: "ENERGY_INSUFFICIENT",
      ...opts,
    });
    this.name = "EnergyInsufficientError";
    this.requested = requested;
    this.available = available;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Streaming Errors ───────────────────────────────────────────────────────

export class StreamDisconnectedError extends HarchOSError {
  public readonly code_: number | null;

  constructor(
    code: number | null,
    opts?: { cause?: Error },
  ) {
    super({
      message: `WebSocket disconnected with code ${code ?? "unknown"}`,
      code: "STREAM_DISCONNECTED",
      ...opts,
    });
    this.name = "StreamDisconnectedError";
    this.code_ = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Type Guard Helpers ─────────────────────────────────────────────────────

/** Type-safe check for HarchOSError (works across realms) */
export function isHarchOSError(error: unknown): error is HarchOSError {
  return error instanceof HarchOSError;
}

/** Narrow error by its discriminated code */
export function isErrorCode<T extends HarchOSErrorCode>(
  error: unknown,
  code: T,
): error is HarchOSError & { code: T } {
  return isHarchOSError(error) && error.code === code;
}
