/**
 * HarchOS SDK error hierarchy.
 *
 * All exceptions inherit from {@link HarchOSError} for easy catch-all handling.
 */

/** Base exception for all HarchOS SDK errors. */
export class HarchOSError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly headers: Record<string, string>;
  public readonly body?: unknown;

  constructor(
    message = "An unknown error occurred",
    opts?: {
      code?: string;
      statusCode?: number;
      headers?: Record<string, string>;
      body?: unknown;
    },
  ) {
    super(message);
    this.name = "HarchOSError";
    this.code = opts?.code;
    this.statusCode = opts?.statusCode;
    this.headers = opts?.headers ?? {};
    this.body = opts?.body;
  }
}

/** Raised when authentication fails. */
export class AuthenticationError extends HarchOSError {
  constructor(message = "Authentication failed", opts?: { code?: string; statusCode?: number }) {
    super(message, { code: opts?.code ?? "authentication_error", statusCode: opts?.statusCode });
    this.name = "AuthenticationError";
  }
}

/** Raised when the API key is invalid. */
export class InvalidAPIKeyError extends AuthenticationError {
  constructor(message = "Invalid API key") {
    super(message, { code: "invalid_api_key", statusCode: 401 });
    this.name = "InvalidAPIKeyError";
  }
}

/** Raised when the API key has expired. */
export class APIKeyExpiredError extends AuthenticationError {
  constructor(message = "API key has expired") {
    super(message, { code: "api_key_expired", statusCode: 401 });
    this.name = "APIKeyExpiredError";
  }
}

/** Raised when the authenticated principal lacks permissions. */
export class PermissionDeniedError extends HarchOSError {
  constructor(message = "Permission denied") {
    super(message, { code: "permission_denied", statusCode: 403 });
    this.name = "PermissionDeniedError";
  }
}

/** Raised on HTTP 400. */
export class BadRequestError extends HarchOSError {
  constructor(message = "Bad request") {
    super(message, { code: "bad_request", statusCode: 400 });
    this.name = "BadRequestError";
  }
}

/** Raised on HTTP 401. */
export class UnauthorizedError extends AuthenticationError {
  constructor(message = "Unauthorized") {
    super(message, { code: "unauthorized", statusCode: 401 });
    this.name = "UnauthorizedError";
  }
}

/** Raised on HTTP 403. */
export class ForbiddenError extends HarchOSError {
  constructor(message = "Forbidden") {
    super(message, { code: "forbidden", statusCode: 403 });
    this.name = "ForbiddenError";
  }
}

/** Raised on HTTP 404. */
export class NotFoundError extends HarchOSError {
  constructor(message = "Resource not found") {
    super(message, { code: "not_found", statusCode: 404 });
    this.name = "NotFoundError";
  }
}

/** Raised on HTTP 409. */
export class ConflictError extends HarchOSError {
  constructor(message = "Conflict") {
    super(message, { code: "conflict", statusCode: 409 });
    this.name = "ConflictError";
  }
}

/** Raised on HTTP 429. */
export class RateLimitError extends HarchOSError {
  public readonly retryAfter?: number;

  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message, { code: "rate_limit", statusCode: 429 });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Raised on HTTP 500. */
export class InternalServerError extends HarchOSError {
  constructor(message = "Internal server error") {
    super(message, { code: "internal_server_error", statusCode: 500 });
    this.name = "InternalServerError";
  }
}

/** Raised on HTTP 503. */
export class ServiceUnavailableError extends HarchOSError {
  constructor(message = "Service temporarily unavailable") {
    super(message, { code: "service_unavailable", statusCode: 503 });
    this.name = "ServiceUnavailableError";
  }
}

/** Raised when an operation violates data sovereignty constraints. */
export class SovereigntyError extends HarchOSError {
  constructor(message = "Operation violates sovereignty constraints") {
    super(message, { code: "sovereignty_violation" });
    this.name = "SovereigntyError";
  }
}

/** Raised when data residency constraints are violated. */
export class DataResidencyError extends SovereigntyError {
  public readonly requiredRegion?: string;
  public readonly actualRegion?: string;

  constructor(
    message = "Data residency constraint violated",
    opts?: { requiredRegion?: string; actualRegion?: string },
  ) {
    super(message);
    this.name = "DataResidencyError";
    this.requiredRegion = opts?.requiredRegion;
    this.actualRegion = opts?.actualRegion;
  }
}

/** Raised when the carbon budget is exceeded. */
export class CarbonBudgetExceededError extends SovereigntyError {
  public readonly budgetGrams?: number;
  public readonly actualGrams?: number;

  constructor(
    message = "Carbon budget exceeded",
    opts?: { budgetGrams?: number; actualGrams?: number },
  ) {
    super(message);
    this.name = "CarbonBudgetExceededError";
    this.budgetGrams = opts?.budgetGrams;
    this.actualGrams = opts?.actualGrams;
  }
}

/** Raised when request data fails validation. */
export class ValidationError extends HarchOSError {
  public readonly field?: string;

  constructor(message = "Validation error", field?: string) {
    super(message, { code: "validation_error" });
    this.name = "ValidationError";
    this.field = field;
  }
}

/** Raised when a request times out. */
export class TimeoutError extends HarchOSError {
  constructor(message = "Request timed out") {
    super(message, { code: "timeout" });
    this.name = "TimeoutError";
  }
}

/** Raised when a connection fails. */
export class ConnectionError extends HarchOSError {
  constructor(message = "Connection failed") {
    super(message, { code: "connection_error" });
    this.name = "ConnectionError";
  }
}

// ---------------------------------------------------------------------------
// Status-code mapping
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STATUS_CODE_MAP: Record<number, new (msg?: string, ...args: any[]) => HarchOSError> = {
  400: BadRequestError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
  429: RateLimitError,
  500: InternalServerError,
  503: ServiceUnavailableError,
};

/** Raise the appropriate typed error for an HTTP status code. */
export function raiseForStatus(
  statusCode: number,
  message: string,
  headers?: Record<string, string>,
  body?: unknown,
): void {
  if (statusCode >= 200 && statusCode < 300) return;

  const ErrorClass = STATUS_CODE_MAP[statusCode];
  if (ErrorClass === RateLimitError) {
    const retryAfter = headers?.["retry-after"]
      ? Number(headers["retry-after"])
      : undefined;
    throw new RateLimitError(message, retryAfter);
  }
  if (ErrorClass) {
    throw new ErrorClass(message);
  }
  throw new HarchOSError(message, { statusCode, body });
}
